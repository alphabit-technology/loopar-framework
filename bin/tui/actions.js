/**
 * Tenant actions + the wizard/confirm flows. All orchestration comes from
 * tenant-service.js — the SAME module the TenantManager entity (Desk UI /
 * loopar.build) delegates to — so every surface manages tenants identically.
 */
import { spawn } from "child_process";
import "loopar/bin/pm2-home.js";
import {
  tenants,
  getTenantData,
  saveTenant,
  allocateFreePort,
  tenantUrl,
} from "loopar/bin/tenant/tenant-builder.js";
import {
  withPm2Bus,
  pm2Action,
  tenantStatus as pm2Status,
  destroy as destroyTenant,
} from "loopar/bin/tenant/tenant-service.js";
import CaddyManager from "loopar/bin/tenant/caddy-manager.js";
import { silenced, quit } from "./term.js";
import { state, NO_PM2 } from "./state.js";
import { render } from "./render.js";
import { openLogs } from "./logs.js";

// ─── Caddy route probe ──────────────────────────────────────────────────────

// One cheap call to the local Caddy admin API per refresh: which domains have
// a route, and on which HTTP port Caddy listens. Lets local URLs drop the
// tenant port (http://dev.localhost instead of :3003) whenever Caddy actually
// routes them. Bounded by an abort timer so a stopped Caddy never stalls the
// UI; on failure we keep the last known answer to avoid URL flicker.
let caddyState = null;

async function probeCaddy() {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 400);
    const res = await fetch("http://localhost:2019/config/apps/http/servers/srv0", { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return caddyState;
    const srv = await res.json();
    const listen = Array.isArray(srv?.listen) ? srv.listen[0] : ":80";
    const m = String(listen || "").match(/:(\d+)$/);
    const hosts = new Set();
    for (const route of srv?.routes || []) {
      for (const match of route.match || []) {
        for (const h of match.host || []) hosts.add(h);
      }
    }
    caddyState = { port: m ? Number(m[1]) : 80, hosts };
  } catch (_) { /* Caddy down/unreachable — keep last known state */ }
  return caddyState;
}

// ─── Data ───────────────────────────────────────────────────────────────────

export async function loadRows(withStatus = true) {
  const caddy = withStatus ? await probeCaddy() : caddyState;

  const all = tenants()
    .map((t) => {
      const domain = t.env.DOMAIN || `${t.name}.localhost`;
      // Same URL logic the provisioning flow uses (localhost:port vs https)...
      const direct = tenantUrl(t.name, { domain, port: t.env.PORT });
      // ...but when Caddy routes a LOCAL domain, prefer the portless URL
      // (Caddy proxies to the tenant port). Real domains stay https://.
      const viaCaddy = caddy?.hosts.has(domain) && direct?.startsWith("http://")
        ? (caddy.port === 80 ? `http://${domain}` : `http://${domain}:${caddy.port}`)
        : null;
      return {
        name: t.name,
        port: t.env.PORT || "",
        domain: t.env.DOMAIN || "",
        env: t.env.NODE_ENV || "development",
        url: viaCaddy || direct,
      };
    })
    .sort((a, b) => (b.name === "dev") - (a.name === "dev") || a.name.localeCompare(b.name));

  if (withStatus && !NO_PM2) {
    await silenced(() => withPm2Bus(async () => {
      for (const row of all) row.status = await pm2Status(row.name);
    })).catch(() => { for (const row of all) row.status ??= "stopped"; });
  } else {
    for (const row of all) row.status = NO_PM2 ? "n/a" : "…";
  }

  state.rows = all;
  if (state.selected >= all.length) state.selected = Math.max(0, all.length - 1);
}

// ─── Open in browser ────────────────────────────────────────────────────────

// The TUI owns the mouse (SGR tracking), so plain clicks never reach the
// terminal's own link handling — we open the browser ourselves instead.
// (Cmd/Ctrl+click still works for the OSC 8 links where supported.)
export function openUrl(url) {
  const [cmd, args] =
    process.platform === "darwin" ? ["open", [url]] :
    process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] :
    ["xdg-open", [url]];
  try {
    spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
    return true;
  } catch (_) {
    return false;
  }
}

// ─── Tenant actions (thin wrappers over tenant-service) ─────────────────────

// Caddy parity with the UI's initInstance(): when the tenant has a DOMAIN,
// register the reverse-proxy route after PM2 brings it up. Best-effort — a
// Caddy failure never blocks the tenant (port access still works), it just
// shows up in the status message. registerTenant() dedups by domain, so
// calling it on every start/restart is safe.
async function caddyRegister(name) {
  const env = getTenantData(name, null)?.env || {};
  const domain = (env.DOMAIN || "").trim();
  if (!domain) return "";
  try {
    const caddy = new CaddyManager();
    await caddy.ensureReady();
    const ok = await caddy.registerTenant(domain, env.PORT);
    return ok
      ? ` · http://${domain}`
      : ` · caddy register failed (port access still works)`;
  } catch (err) {
    return ` · caddy: ${err.message} (port access still works)`;
  }
}

export const actions = {
  start: (name) => silenced(async () => {
    const ok = await withPm2Bus(() => pm2Action(name, "start"));
    if (!ok) return "PM2 start failed";
    return `${name} started${await caddyRegister(name)}`;
  }),

  stop: (name) => silenced(() => withPm2Bus(async () =>
    (await pm2Action(name, "stop")) ? `${name} stopped` : "PM2 stop failed")),

  // service "restart" for non-self targets = delete + fresh start, so .env
  // changes apply (same as CLI restart <site> and the UI's external restart).
  // Caddy route is re-registered after, mirroring the entity's restart().
  restart: (name) => silenced(async () => {
    const ok = await withPm2Bus(() => pm2Action(name, "restart"));
    if (!ok) return "PM2 restart failed";
    return `${name} restarted${await caddyRegister(name)}`;
  }),

  // Remove from the PM2 registry only — sites/<name>/ stays on disk.
  unregister: (name) => silenced(() => withPm2Bus(async () =>
    (await pm2Action(name, "delete")) ? `${name} removed from PM2` : "PM2 delete failed")),

  // Full teardown: PM2 stop+delete, Caddy route, rm -rf sites/<name>.
  async destroy(name) {
    const domain = getTenantData(name, null)?.env?.DOMAIN || null;
    await silenced(() => destroyTenant(name, { domain, removePath: true }));
    return `${name} destroyed (sites/${name} removed)`;
  },
};

// ─── Dispatcher ─────────────────────────────────────────────────────────────

async function execute(action, name) {
  state.busy = true; render();
  try {
    const msg = await actions[action](name);
    state.message = msg;
    state.messageKind = /fail|not found/i.test(msg) ? "error" : "ok";
  } catch (err) {
    state.message = err.message || String(err);
    state.messageKind = "error";
  }
  await loadRows();
  state.busy = false;
  render();
}

export async function run(action) {
  const sel = state.rows[state.selected];

  if (action === "quit") return quit();
  if (action === "refresh") {
    state.busy = true; render();
    await loadRows();
    state.busy = false; state.message = "refreshed"; state.messageKind = "info";
    return render();
  }
  if (action === "new") {
    let port = "3100";
    try { port = String(allocateFreePort()); } catch (_) { /* keep fallback */ }
    return openWizard("New tenant", [
      { key: "name", label: "name", value: "", validate: (v) => /^[a-z0-9][a-z0-9-]*$/.test(v) || "Invalid name (a-z, 0-9, dashes)" },
      { key: "port", label: "port", value: port, validate: (v) => /^\d{2,5}$/.test(v) || "Invalid port" },
      { key: "domain", label: "domain", default: (d) => `${d.name}.localhost`, validate: (v) => v === "" || /^[a-z0-9][a-z0-9.-]*$/.test(v) || "Invalid domain" },
    ], (data) => {
      // Last question doubles as the final confirmation:
      // Yes = create + start, No = create only, Esc = abort entirely.
      state.mode = "confirm";
      state.confirm = {
        question: `Create "${data.name}" (port ${data.port}) — start it now?`,
        onYes: () => createTenant(data, true),
        onNo: () => createTenant(data, false),
      };
      render();
    });
  }
  if (action === "destroy") {
    if (!sel) return;
    state.mode = "destroy"; state.input = ""; state.message = "";
    return render();
  }
  // Merged live stream of EVERY pm2 process (pm2-logs style, name-prefixed).
  // Works even with nothing selected.
  if (action === "logs-all") return openLogs(null);

  if (!sel) return;

  if (action === "logs") return openLogs(sel.name);

  if (action === "open") {
    if (!sel.url) {
      state.message = "no URL for this tenant"; state.messageKind = "error";
      return render();
    }
    // Clicking a dead tenant's URL would only show a connection error in the
    // browser — offer to bring it up first, then open. One click + Enter.
    if ((sel.status === "stopped" || sel.status === "errored") && !NO_PM2) {
      state.mode = "confirm";
      state.confirm = {
        question: `"${sel.name}" is ${sel.status} — start it and open?`,
        onYes: async () => {
          state.busy = true; render();
          try {
            const msg = await actions.start(sel.name);
            state.message = msg;
            state.messageKind = /fail/i.test(msg) ? "error" : "ok";
            if (!/fail/i.test(msg)) openUrl(sel.url);
          } catch (err) {
            state.message = err.message || String(err);
            state.messageKind = "error";
          }
          await loadRows();
          state.busy = false;
          render();
        },
      };
      return render();
    }
    const ok = openUrl(sel.url);
    state.message = ok ? `opening ${sel.url}` : "could not launch a browser";
    state.messageKind = ok ? "ok" : "error";
    return render();
  }

  // Per-tenant prod/dev switch: write NODE_ENV to sites/<name>/.env and — if
  // the tenant is running — delete + fresh start so the new mode actually
  // applies (exec_mode cluster/fork and the Vite middleware are decided at
  // process start; only the dev tenant dispatches modes dynamically).
  if (action === "mode") {
    const next = sel.env === "production" ? "development" : "production";
    const willRestart = sel.status === "online" && !NO_PM2;
    state.mode = "confirm";
    state.confirm = {
      question: `Switch "${sel.name}" ${sel.env} → ${next}${willRestart ? " and restart" : ""}?`,
      onYes: async () => {
        state.busy = true; render();
        try {
          await saveTenant({ NAME: sel.name, NODE_ENV: next });
          if (willRestart) {
            const msg = await actions.restart(sel.name);
            state.message = `${sel.name} → ${next} · ${msg}`;
            state.messageKind = /fail/i.test(msg) ? "error" : "ok";
          } else {
            state.message = `${sel.name} → ${next} (applies on next start)`;
            state.messageKind = "ok";
          }
        } catch (err) {
          state.message = err.message || String(err);
          state.messageKind = "error";
        }
        await loadRows();
        state.busy = false;
        render();
      },
    };
    return render();
  }

  if (NO_PM2 && ["start", "stop", "restart", "unregister"].includes(action)) {
    state.message = "PM2 disabled (LOOPAR_TUI_NO_PM2=1)"; state.messageKind = "error";
    return render();
  }

  // stop/restart/unregister interrupt a running tenant — ask first.
  // start is additive and runs directly.
  if (["stop", "restart", "unregister"].includes(action)) {
    state.mode = "confirm";
    state.confirm = {
      question: `${action[0].toUpperCase() + action.slice(1)} tenant "${sel.name}"?`,
      onYes: () => execute(action, sel.name),
    };
    return render();
  }

  return execute(action, sel.name);
}

// ─── Wizard (multi-step text input) ─────────────────────────────────────────

export function openWizard(title, steps, onDone) {
  state.mode = "create";
  state.message = "";
  state.wizard = { title, steps, idx: 0, onDone };
  state.input = steps[0].value || "";
  render();
}

const collectedWizard = (w) =>
  Object.fromEntries(w.steps.map((s) => [s.key, s.value]));

export function advanceWizard() {
  const w = state.wizard;
  if (!w) return;
  const st = w.steps[w.idx];
  const v = state.input.trim();
  const valid = st.validate ? st.validate(v, collectedWizard(w)) : true;
  if (valid !== true) {
    state.message = valid; state.messageKind = "error";
    return render();
  }
  st.value = v;
  state.message = "";
  if (w.idx < w.steps.length - 1) {
    w.idx++;
    const next = w.steps[w.idx];
    if (!next.value && next.default) next.value = next.default(collectedWizard(w));
    state.input = next.value || "";
    return render();
  }
  state.wizard = null;
  state.mode = "list";
  w.onDone(collectedWizard(w));
}

async function createTenant(data, startAfter) {
  state.busy = true; render();
  try {
    if (getTenantData(data.name, null)) throw new Error(`Tenant "${data.name}" already exists`);
    await saveTenant({
      ID: data.name,
      NAME: data.name,
      PORT: data.port,
      DOMAIN: data.domain || undefined,
      NODE_ENV: "development",
    });
    state.message = `${data.name} created on port ${data.port}`;
    state.messageKind = "ok";
    if (startAfter) {
      state.message = NO_PM2
        ? `${data.name} created — PM2 disabled, not started`
        : `${data.name} created — ${await actions.start(data.name)}`;
    }
  } catch (err) {
    state.message = err.message || String(err);
    state.messageKind = "error";
  }
  await loadRows();
  state.busy = false;
  const i = state.rows.findIndex((r) => r.name === data.name);
  if (i >= 0) state.selected = i;
  render();
}

export async function submitModal() {
  const name = state.input.trim();
  const target = state.rows[state.selected]?.name;
  state.mode = "list";
  if (name !== target) {
    state.message = "Destroy cancelled (name did not match)"; state.messageKind = "info";
    return render();
  }
  state.busy = true; render();
  try {
    state.message = await actions.destroy(target);
    state.messageKind = "ok";
  } catch (err) {
    state.message = err.message; state.messageKind = "error";
  }
  await loadRows();
  state.busy = false;
  render();
}
