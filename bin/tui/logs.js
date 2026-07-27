/**
 * Logs tab — realtime log stream, pm2-logs style. Two scopes:
 */
import fs from "fs";
import path from "path";
import pm2 from "pm2";
import { withPm2 } from "../cli/pm2.js";
import { silenced } from "./term.js";
import { state, NO_PM2 } from "./state.js";
import { render } from "./render.js";

const LOGS_DIR = () => path.join(process.env.PM2_HOME || path.join(process.cwd(), ".pm2"), "logs");
const TAIL_BYTES = 64 * 1024;
const HIST_LINES = 300;
const HIST_ALL = 12;
const HIST_ALL_ERR = 4;
const MAX_LINES = 2000;
const POLL_MS = 700;

let pollTimer = null;
let bus = null;
let busConnected = false;
let renderQueued = false;
let lastSig = "";

const meta = (text) => ({ s: "meta", text });

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  setTimeout(() => {
    renderQueued = false;
    if (state.view === "logs") render();
  }, 80);
}

async function describePaths(name) {
  if (NO_PM2) return null;
  try {
    return await silenced(() => withPm2(() => new Promise((res) =>
      pm2.describe(name, (err, desc) => {
        const env = !err && desc?.[0]?.pm2_env;
        res(env ? { out: env.pm_out_log_path || null, err: env.pm_err_log_path || null } : null);
      })
    )));
  } catch (_) {
    return null;
  }
}

/** Every process pm2 knows about (any status), with its exact log paths. */
async function listProcs() {
  if (NO_PM2) return [];
  try {
    return await silenced(() => withPm2(() => new Promise((res) =>
      pm2.list((err, list) => res(err ? [] : (list || []).map((p) => ({
        name: p.name,
        out: p.pm2_env?.pm_out_log_path || null,
        err: p.pm2_env?.pm_err_log_path || null,
      }))))
    )));
  } catch (_) {
    return [];
  }
}

function newestMatch(name, kind) {
  try {
    const dir = LOGS_DIR();
    const re = new RegExp(`^${name}-${kind}(-\\d+)?\\.log$`);
    const hits = fs.readdirSync(dir)
      .filter((f) => re.test(f))
      .map((f) => ({ f, m: fs.statSync(path.join(dir, f)).mtimeMs }))
      .sort((a, b) => b.m - a.m);
    return hits[0] ? path.join(dir, hits[0].f) : null;
  } catch (_) {
    return null;
  }
}

function readTail(file) {
  try {
    const { size } = fs.statSync(file);
    const start = Math.max(0, size - TAIL_BYTES);
    const fd = fs.openSync(file, "r");
    const buf = Buffer.alloc(size - start);
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    let lines = buf.toString("utf8").split("\n");
    if (start > 0) lines = lines.slice(1); // first line is likely partial
    if (lines[lines.length - 1] === "") lines.pop();
    return lines;
  } catch (_) {
    return null;
  }
}

function buildHistory(L) {
  const out = (L.paths.out && readTail(L.paths.out)) || [];
  const err = (L.paths.err && readTail(L.paths.err)) || [];
  const lines = [];
  if (out.length) {
    lines.push(meta(`── stdout · last ${Math.min(out.length, HIST_LINES)} lines ──`));
    lines.push(...out.slice(-HIST_LINES).map((t) => ({ s: "out", text: t })));
  }
  if (err.length) {
    lines.push(meta(`── stderr · last ${Math.min(err.length, HIST_LINES)} lines ──`));
    lines.push(...err.slice(-HIST_LINES).map((t) => ({ s: "err", text: t })));
  }
  if (!lines.length) lines.push(meta("(no log output yet)"));
  return lines;
}

function buildHistoryAll(L) {
  const lines = [];
  for (const p of L.procs) {
    const out = (p.out && readTail(p.out)) || [];
    const err = (p.err && readTail(p.err)) || [];
    if (!out.length && !err.length) continue;
    lines.push(meta(`── ${p.name} ──`));
    lines.push(...out.slice(-HIST_ALL).map((t) => ({ s: "out", text: t, p: p.name })));
    lines.push(...err.slice(-HIST_ALL_ERR).map((t) => ({ s: "err", text: t, p: p.name })));
  }
  if (!lines.length) lines.push(meta("(no pm2 processes with logs — is anything running?)"));
  return lines.slice(-MAX_LINES);
}

// ─── Live stream (pm2 event bus — what `pm2 logs` uses) ─────────────────────

function onPacket(kind, packet) {
  const L = state.logs;
  if (!L || state.view !== "logs") return;
  const pname = packet?.process?.name;
  if (L.name && pname !== L.name) return; // single-tenant scope filters
  const at = packet.at || Date.now();
  for (const text of String(packet.data ?? "").split("\n")) {
    if (text === "") continue;
    L.lines.push({ s: kind, text, at, p: L.name ? undefined : pname });
  }
  if (L.lines.length > MAX_LINES) L.lines.splice(0, L.lines.length - MAX_LINES);
  scheduleRender();
}

function startBus() {
  if (NO_PM2) return Promise.resolve(false);
  return new Promise((resolve) => {
    pm2.connect((err) => {
      if (err) return resolve(false);
      busConnected = true;
      pm2.launchBus((err2, b) => {
        if (err2 || !b) return resolve(false);
        bus = b;
        bus.on("log:out", (p) => onPacket("out", p));
        bus.on("log:err", (p) => onPacket("err", p));
        resolve(true);
      });
    });
  });
}

function pollFallback() {
  const L = state.logs;
  if (!L || state.view !== "logs") return;
  const files = L.name
    ? [L.paths.out, L.paths.err]
    : L.procs.flatMap((p) => [p.out, p.err]);
  const sig = files.map((f) => {
    try { return f ? fs.statSync(f).size : 0; } catch (_) { return 0; }
  }).join(":");
  if (sig === lastSig) return;
  lastSig = sig;
  L.lines = L.name ? buildHistory(L) : buildHistoryAll(L);
  render();
}


/** name = one tenant; null = every pm2 process, merged. */
export async function openLogs(name = null) {
  closeLogs();
  state.view = "logs";
  state.logs = {
    name, // null = all-processes scope
    lines: [meta("resolving log files...")],
    follow: true, // pinned to the tail; scrolling pauses, [f] resumes
    scroll: 0,
    viewH: 10, // render() keeps this in sync with the real window
    paths: { out: null, err: null },
    procs: [],
    live: false,
  };
  render();

  const L = state.logs;
  if (name) {
    const described = await describePaths(name);
    if (state.logs !== L) return; // user left the tab mid-await
    L.paths = {
      out: described?.out || newestMatch(name, "out"),
      err: described?.err || newestMatch(name, "error"),
    };
    L.lines = buildHistory(L);
  } else {
    L.procs = await listProcs();
    if (state.logs !== L) return;
    L.lines = buildHistoryAll(L);
  }
  render();

  L.live = await startBus();
  if (state.logs !== L) return;
  if (L.live) {
    L.lines.push(meta("── live ──"));
    render();
  } else {
    lastSig = "";
    pollTimer = setInterval(pollFallback, POLL_MS);
  }
}

export function closeLogs() {
  if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
  if (bus) { try { bus.close(); } catch (_) { /* already gone */ } bus = null; }
  if (busConnected) { try { pm2.disconnect(); } catch (_) { /* already gone */ } busConnected = false; }
  lastSig = "";
  state.logs = null;
  state.view = "tenants";
}

/** F5 — re-resolve paths and rebuild history (restarts the live stream). */
export function reloadLogs() {
  if (state.logs) openLogs(state.logs.name || null);
}
