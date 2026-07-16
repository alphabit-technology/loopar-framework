/**
 * Drawing. Pure output: reads `state`, writes one frame to stdout, and
 * refreshes the clickable regions (state.rowRegionStart / buttonRegions /
 * urlCol). Two full-screen tabs: the tenant table ("tenants") and the
 * realtime log stream ("logs" — data managed by logs.js).
 *
 * Visual language (ANSI only, no deps):
 *   - "pills": explicit BACKGROUND color + black/bright-white foreground,
 *     picked for contrast. (The previous inverse-video trick made the text
 *     color depend on the terminal theme's background — dark themes turned
 *     the blue/gray pills illegible.)
 *   - underlined letter inside a pill = its hotkey.
 *   - status = media-style glyphs: ▶ online · ■ stopped · ✖ errored.
 *   - the SELECTED row is one uniform inverse bar — per-cell colors are
 *     dropped there on purpose; colored fg + inverse painted random
 *     background blocks on some terminal themes.
 */
import { A, pad, link, stripAnsi } from "./term.js";
import { state, NO_PM2 } from "./state.js";

// Local extras (kept out of term.js to avoid touching shared primitives).
const ESC = "\x1b";
const MAGENTA = `${ESC}[35m`;
const BLUE = `${ESC}[34m`;
const WHITE = `${ESC}[37m`;
const U = `${ESC}[4m`;    // underline on (hotkey letter)
const UO = `${ESC}[24m`;  // underline off

// Colored chip with GUARANTEED contrast: background color code + a
// foreground chosen per background (black on light, bright white on dark).
const PILL_BG = {
  green:   { bg: "42",  fg: "30" },
  yellow:  { bg: "43",  fg: "30" },
  cyan:    { bg: "46",  fg: "30" },
  white:   { bg: "47",  fg: "30" },
  red:     { bg: "41",  fg: "97" },
  blue:    { bg: "44",  fg: "97" },
  magenta: { bg: "45",  fg: "97" },
  gray:    { bg: "100", fg: "97" },
};
const pill = (label, color = "white") => {
  const c = PILL_BG[color] || PILL_BG.white;
  return `${ESC}[${c.bg};${c.fg}m${label}${A.reset}`;
};

// Stable per-process color for the all-logs prefix (red is reserved for
// stderr bodies, so it's not in the palette).
const NAME_COLORS = [A.cyan, A.green, A.yellow, MAGENTA, BLUE, WHITE];
function nameColor(n) {
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return NAME_COLORS[h % NAME_COLORS.length];
}

const COLS = [
  { key: "name", label: "TENANT", w: 22 },
  { key: "port", label: "PORT", w: 7 },
  { key: "env", label: "ENV", w: 6 },
  { key: "url", label: "URL", w: 44 },
  { key: "status", label: "ST", w: 4 },
];

// Media-style state glyphs: compact, readable by shape even without color.
const STATUS_META = {
  online:    { dot: "▶", color: A.green },
  stopped:   { dot: "■", color: A.red },
  errored:   { dot: "✖", color: A.red },
  launching: { dot: "◐", color: A.yellow },
  "n/a":     { dot: "◌", color: A.gray },
  "…":       { dot: "◌", color: A.gray },
};
const statusMeta = (s) => STATUS_META[s] || { dot: "◐", color: A.yellow };

function hr(width) {
  return A.gray + "─".repeat(Math.min(width, 100)) + A.reset;
}

/** Title + spacer + clickable [Tenants][Logs] tabs + separator (4 lines). */
function pushHeader(lines, width) {
  const daemon = NO_PM2
    ? `${A.gray}pm2 disabled${A.reset}`
    : `${A.gray}pm2 ${process.env.PM2_HOME || ""}${A.reset}`;
  lines.push(` ${pill(` ◆ LOOPAR `, "cyan")} ${A.bold}Tenant Manager${A.reset}  ${daemon}`);
  lines.push(""); // breathing room so the title pill and the active tab don't stack

  const logsLabel = `LOGS${state.logs ? ` · ${state.logs.name || "all"}` : ""}`;
  const tabs = [
    { label: "TENANTS", view: "tenants", action: "tab-tenants" },
    { label: logsLabel, view: "logs", action: "tab-logs" },
  ];
  let x = 2; // line starts with one space; x is 1-based
  const parts = [];
  for (const t of tabs) {
    const rendered = ` ${t.label} `;
    state.buttonRegions.push({ x1: x, x2: x + rendered.length - 1, y: 3, action: t.action });
    parts.push(
      state.view === t.view
        ? pill(rendered, "cyan")
        : `${A.dim}${rendered}${A.reset}`
    );
    x += rendered.length + 1;
  }
  lines.push(" " + parts.join(" "));
  lines.push(hr(width));
}

function renderTenants(lines, width, height) {
  // ── Horizontal column window ──
  // TENANT is frozen; the remaining columns are windowed by the available
  // width and shifted with ←/→ (state.colOff). Rows never exceed the
  // terminal width, so narrow consoles CLIP columns instead of wrapping —
  // wrapped rows used to overlap and corrupt the whole frame.
  const nameCol = COLS[0];
  const rest = COLS.slice(1);
  const avail = width - 2 - nameCol.w; // 2-char row prefix
  const totalRestW = rest.reduce((s, c) => s + c.w, 0);
  if (totalRestW <= avail) state.colOff = 0; // everything fits — no window
  state.colOff = Math.min(Math.max(0, state.colOff || 0), rest.length - 1);
  const visCols = [];
  let usedW = 0;
  for (let i = state.colOff; i < rest.length; i++) {
    if (usedW + rest[i].w > avail && visCols.length) break;
    visCols.push(rest[i]);
    usedW += rest[i].w;
  }
  const shownCols = [nameCol, ...visCols];
  const moreLeft = state.colOff > 0;
  const moreRight = state.colOff + visCols.length < rest.length;

  // x-range of the URL column (rows start with a 2-char prefix, x is 1-based)
  // — the mouse handler turns a click there into "open in browser". Only
  // valid while the URL column is inside the window.
  let colX = 3;
  state.urlCol = null;
  for (const c of shownCols) {
    if (c.key === "url") { state.urlCol = { x1: colX, x2: colX + c.w - 1 }; break; }
    colX += c.w;
  }

  // Column header (‹ › mark columns hidden beyond each edge)
  const headCells = shownCols.map((c) => `${A.bold}${A.gray}${pad(c.label, c.w)}${A.reset}`).join("");
  const marks = `${moreLeft ? `${A.cyan}‹${A.reset}` : ""}${moreRight ? `${A.cyan}›${A.reset}` : ""}`;
  lines.push("  " + headCells + marks);

  // Table window (header 4 + col header 1 + scroll 1 + sep 1 + footer 1 + msg 1)
  const tableHeight = Math.max(3, height - 10);
  state.tableH = tableHeight; // PgUp/PgDn page size for the input handler
  state.rowRegionStart = lines.length + 1; // 1-based terminal row of first tenant row

  if (state.selected < state.scroll) state.scroll = state.selected;
  if (state.selected >= state.scroll + tableHeight) state.scroll = state.selected - tableHeight + 1;

  const visible = state.rows.slice(state.scroll, state.scroll + tableHeight);
  for (let i = 0; i < visible.length; i++) {
    const row = visible[i];
    const isSel = state.scroll + i === state.selected;
    const cells = shownCols.map((c) => {
      const raw = String(row[c.key] ?? "");
      if (c.key === "name") {
        // Plain uppercased text for scanability. Deliberately NO OSC 8 link
        // here — the terminal's hover tooltip ("cmd+click") got in the way of
        // plain row clicks, and the URL column / double-click already cover
        // opening the browser.
        const plain = (raw.length > c.w - 1 ? raw.slice(0, c.w - 1) : raw).toUpperCase();
        return (isSel ? `${A.bold}${plain}` : plain) + " ".repeat(c.w - plain.length);
      }
      if (c.key === "url") {
        const u = raw.length > c.w - 3 ? raw.slice(0, c.w - 4) + "…" : raw;
        const txt = u ? `${u} ↗` : "";
        if (isSel) return pad(txt, c.w); // uniform selection bar — no colors inside
        return pad(u ? `${A.cyan}${txt}${A.reset}` : "", c.w);
      }
      if (c.key === "status") {
        const m = statusMeta(row.status);
        if (isSel) return pad(m.dot, c.w);
        return pad(`${m.color}${m.dot}${A.reset}`, c.w);
      }
      if (c.key === "env") {
        const label = row.env === "production" ? "prod" : "dev";
        if (isSel) return pad(label, c.w);
        return pad(
          row.env === "production"
            ? `${A.yellow}${A.bold}${label}${A.reset}`
            : `${A.dim}${label}${A.reset}`,
          c.w
        );
      }
      return pad(raw, c.w); // port
    }).join("");
    lines.push(isSel ? `${A.inv}❯ ${cells}${A.reset}` : `  ${cells}`);
  }

  // Empty state: guide instead of a blank void.
  if (state.rows.length === 0) {
    lines.push("");
    lines.push(`   ${A.dim}No tenants in sites/ yet.${A.reset}`);
    lines.push(`   ${A.dim}Press ${A.reset}${pill(` ✚ ${U}N${UO}ew `, "blue")}${A.dim} to create your first one — port and domain are prefilled.${A.reset}`);
    for (let i = 3; i < tableHeight; i++) lines.push("");
  } else {
    for (let i = visible.length; i < tableHeight; i++) lines.push("");
  }

  // Scroll indicator when the list overflows; state-glyph legend otherwise.
  const legend = `  ${A.green}▶${A.reset}${A.dim} online · ${A.reset}${A.red}■${A.reset}${A.dim} stopped · ${A.reset}${A.red}✖${A.reset}${A.dim} errored${A.reset}`;
  const colHint = (moreLeft || moreRight) ? `${A.dim} · ←→ columns${A.reset}` : "";
  const scrollInfo = state.rows.length > tableHeight
    ? `${A.dim}  ${state.scroll + 1}–${Math.min(state.scroll + tableHeight, state.rows.length)} of ${state.rows.length} · PgUp/PgDn page · Home/End jump${A.reset}${legend}`
    : (state.rows.length ? legend : "");
  lines.push(scrollInfo + colHint);
  lines.push(hr(width));

  // Footer: mode-dependent
  if (state.mode === "create" && state.wizard) {
    const w = state.wizard;
    const st = w.steps[w.idx];
    const dots = w.steps.map((_, i) =>
      i < w.idx ? `${A.green}●${A.reset}` : i === w.idx ? `${A.cyan}●${A.reset}` : `${A.gray}○${A.reset}`
    ).join(" ");
    const shown = st.mask ? "*".repeat(state.input.length) : state.input;
    lines.push(` ${pill(` ${w.title} `, "cyan")} ${dots}  ${A.bold}${st.label}${A.reset} ${A.gray}›${A.reset} ${shown}${A.inv} ${A.reset}  ${A.dim}Enter next · Esc cancel${A.reset}`);
  } else if (state.mode === "confirm" && state.confirm) {
    const y = lines.length + 1;
    const yesLabel = ` ✓ ${U}Y${UO}es `;
    const noLabel = ` ✗ ${U}N${UO}o `;
    const yesW = stripAnsi(yesLabel).length;
    const noW = stripAnsi(noLabel).length;
    const prefix = ` ${A.yellow}◆ ${state.confirm.question}${A.reset}  `;
    const px = stripAnsi(prefix).length;
    state.buttonRegions.push({ x1: px + 1, x2: px + yesW, y, action: "confirm-yes" });
    state.buttonRegions.push({ x1: px + yesW + 2, x2: px + yesW + 1 + noW, y, action: "confirm-no" });
    lines.push(`${prefix}${pill(yesLabel, "green")} ${pill(noLabel, "red")}  ${A.dim}Esc cancel${A.reset}`);
  } else if (state.mode === "destroy") {
    const target = state.rows[state.selected]?.name || "";
    lines.push(` ${pill(` ⚠ DESTROY `, "red")} ${A.red}deletes sites/${target} from disk.${A.reset} Type the tenant name to confirm ${A.gray}›${A.reset} ${state.input}${A.inv} ${A.reset} ${A.dim}Esc cancel${A.reset}`);
  } else {
    const buttons = [
      { label: ` ▶ ${U}S${UO}tart `, w: 9, color: "green", action: "start" },
      { label: ` ■ S${U}t${UO}op `, w: 8, color: "yellow", action: "stop" },
      { label: ` ↻ ${U}R${UO}estart `, w: 11, color: "cyan", action: "restart" },
      { label: ` ≣ ${U}L${UO}ogs `, w: 8, color: "white", action: "logs" },
      { label: ` ⇄ ${U}P${UO}rod/dev `, w: 12, color: "magenta", action: "mode" },
      { label: ` ✚ ${U}N${UO}ew `, w: 7, color: "blue", action: "new" },
      { label: ` ${U}U${UO}nreg `, w: 7, color: "gray", action: "unregister" },
      { label: ` ✕ ${U}D${UO}estroy `, w: 11, color: "red", action: "destroy" },
      { label: ` ${U}Q${UO}uit `, w: 6, color: "gray", action: "quit" },
    ];
    let x = 1;
    const y = lines.length + 1;
    const parts = [];
    for (const b of buttons) {
      state.buttonRegions.push({ x1: x, x2: x + b.w - 1, y, action: b.action });
      x += b.w + 1;
      parts.push(pill(b.label, b.color));
    }
    lines.push(parts.join(" "));
  }

  // Message / selected tenant URL (underlined hyperlink where supported)
  const sel = state.rows[state.selected];
  const url = sel?.url && state.mode === "list"
    ? `${A.cyan}${A.under}${link(sel.url, sel.url)}${A.reset}`
    : "";
  const icon = state.messageKind === "error" ? `${A.red}✗` : state.messageKind === "ok" ? `${A.green}✓` : `${A.gray}·`;
  const msgColor = state.messageKind === "error" ? A.red : state.messageKind === "ok" ? A.green : A.dim;
  lines.push(state.busy
    ? ` ${A.yellow}◐ working...${A.reset}`
    : ` ${icon} ${msgColor}${state.message}${A.reset}  ${url}`);
}

function renderLogs(lines, width, height) {
  const L = state.logs;
  const scopeInfo = L.name
    ? (L.paths.out || L.paths.err || "no log file found")
    : `${L.procs.length} pm2 processes, merged live`;
  lines.push(` ${pill(` ${L.name || "ALL"} `, "cyan")} ${A.dim}${scopeInfo}${A.reset}`);

  // header 4 + info 1 + sep 1 + footer 1 → log window fills the rest
  const viewH = Math.max(3, height - 7);
  L.viewH = viewH;

  const total = L.lines.length;
  const maxStart = Math.max(0, total - viewH);
  if (L.follow) L.scroll = maxStart;
  else L.scroll = Math.min(Math.max(0, L.scroll), maxStart);

  const shown = L.lines.slice(L.scroll, L.scroll + viewH);
  for (const e of shown) {
    if (e.s === "meta") { lines.push(` ${A.dim}${e.text}${A.reset}`); continue; }
    // Live lines carry the bus timestamp; history lines don't.
    const time = e.at ? `${A.dim}${new Date(e.at).toTimeString().slice(0, 8)}${A.reset} ` : "";
    const timeW = e.at ? 9 : 0;
    // All-processes scope: pm2-logs style name prefix, colored per process.
    const pName = e.p ? (e.p.length > 12 ? e.p.slice(0, 12) : e.p) : "";
    const pfx = e.p ? `${nameColor(e.p)}${pName.padEnd(12)}${A.reset} ${A.gray}│${A.reset} ` : "";
    const pfxW = e.p ? 15 : 0;
    const color = e.s === "err" ? A.red : "";
    const plain = stripAnsi(e.text);
    const room = width - 2 - timeW - pfxW;
    // Keep the app's own ANSI when the line fits; drop it when truncating
    // (slicing mid-escape corrupts the frame).
    const body = plain.length > room ? plain.slice(0, room) : e.text;
    lines.push(` ${time}${pfx}${color}${body}${A.reset}`);
  }
  for (let i = shown.length; i < viewH; i++) lines.push("");

  lines.push(hr(width));
  const pos = total ? `${L.scroll + 1}–${Math.min(L.scroll + viewH, total)}/${total}` : "0/0";
  const mode = L.live ? `${A.green}● live${A.reset}` : `${A.yellow}◐ polling${A.reset}`;
  const follow = L.follow
    ? pill(` following `, "green")
    : pill(` paused · ${U}f${UO} follows `, "yellow");
  const scopeKey = L.name ? `${U}a${UO} all procs` : `${U}a${UO} one tenant`;
  lines.push(` ${A.dim}Tab/Esc tenants · ${scopeKey} · ↑↓/wheel scroll · F5 reload · q quit${A.reset}  ${mode}  ${follow}  ${A.dim}${pos}${A.reset}`);
}

export function render() {
  const width = process.stdout.columns || 100;
  const height = process.stdout.rows || 30;
  const lines = [];
  state.buttonRegions = [];

  pushHeader(lines, width);
  if (state.view === "logs" && state.logs) renderLogs(lines, width, height);
  else renderTenants(lines, width, height);

  process.stdout.write(A.clear + lines.slice(0, height).join("\n"));
}
