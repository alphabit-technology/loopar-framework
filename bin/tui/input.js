/**
 * Input decoding: raw stdin bytes → keyboard/mouse events → state changes.
 * Mouse uses SGR reporting (ESC [ < b ; x ; y M/m), enabled by term.js.
 */
import { quit } from "./term.js";
import { state } from "./state.js";
import { render } from "./render.js";
import { run, advanceWizard, submitModal } from "./actions.js";
import { openLogs, closeLogs, reloadLogs } from "./logs.js";

const DOUBLE_CLICK_MS = 400;
let lastClick = { row: -1, t: 0 };

function handleTabClick(action) {
  if (action === "tab-tenants") {
    if (state.view === "logs") { closeLogs(); render(); }
    return true;
  }
  if (action === "tab-logs") {
    if (state.view !== "logs") {
      const sel = state.rows[state.selected];
      if (sel) openLogs(sel.name);
    }
    return true;
  }
  return false;
}

function handleMouse(seq) {
  // SGR: ESC [ < b ; x ; y (M=press, m=release)
  const m = seq.match(/^\x1b\[<(\d+);(\d+);(\d+)([Mm])$/);
  if (!m) return;
  const [, bStr, xStr, yStr, kind] = m;
  const b = Number(bStr), x = Number(xStr), y = Number(yStr);
  const isClick = kind === "M" && b === 0;

  // Confirm dialog: only the [Y]es / [N]o buttons are live.
  if (state.mode === "confirm") {
    if (!isClick) return;
    const btn = state.buttonRegions.find((r) => r.y === y && x >= r.x1 && x <= r.x2);
    if (!btn) return;
    const c = state.confirm;
    if (btn.action !== "confirm-yes" && btn.action !== "confirm-no") return;
    state.mode = "list"; state.confirm = null;
    if (btn.action === "confirm-yes") return c?.onYes?.();
    return c?.onNo ? c.onNo() : render();
  }
  if (state.mode !== "list") return; // text modals: keyboard only

  // Logs tab: wheel scrolls, clicks only on the header tabs.
  if (state.view === "logs") {
    const L = state.logs;
    if (b === 64 && L) { L.follow = false; L.scroll = Math.max(0, L.scroll - 3); return render(); }
    if (b === 65 && L) { L.scroll += 3; return render(); } // render clamps; at bottom it just stays
    if (!isClick) return;
    const btn = state.buttonRegions.find((r) => r.y === y && x >= r.x1 && x <= r.x2);
    if (btn) handleTabClick(btn.action);
    return;
  }

  if (b === 64) { // wheel up
    state.selected = Math.max(0, state.selected - 1);
    return render();
  }
  if (b === 65) { // wheel down
    state.selected = Math.min(state.rows.length - 1, state.selected + 1);
    return render();
  }
  if (!isClick) return; // left-button press only

  // Row click: first click selects; a click on the URL cell or a
  // double-click anywhere on the row opens the browser.
  const rowIndex = y - state.rowRegionStart + state.scroll;
  if (y >= state.rowRegionStart && rowIndex >= 0 && rowIndex < state.rows.length) {
    const now = Date.now();
    const isDouble = lastClick.row === rowIndex && now - lastClick.t < DOUBLE_CLICK_MS;
    lastClick = { row: rowIndex, t: isDouble ? 0 : now };
    state.selected = rowIndex;
    if (isDouble) return run("open");
    if (state.urlCol && x >= state.urlCol.x1 && x <= state.urlCol.x2) return run("open");
    return render();
  }
  // Header tab / footer button click
  const btn = state.buttonRegions.find((r) => r.y === y && x >= r.x1 && x <= r.x2);
  if (!btn) return;
  if (handleTabClick(btn.action)) return;
  run(btn.action);
}

function handleKey(ch, seq) {
  if (state.mode === "confirm") {
    const c = state.confirm;
    const k = (ch || "").toLowerCase();
    if (seq === "\x1b" || ch === "\x03") { // Esc / Ctrl+C → abort
      state.mode = "list"; state.confirm = null;
      state.message = "cancelled"; state.messageKind = "info";
      return render();
    }
    if (k === "y" || ch === "\r") {
      state.mode = "list"; state.confirm = null;
      return c?.onYes?.();
    }
    if (k === "n") {
      state.mode = "list"; state.confirm = null;
      return c?.onNo ? c.onNo() : render();
    }
    return;
  }

  if (state.mode === "create" || state.mode === "destroy") {
    if (seq === "\x1b" || seq === "\x03") { // Esc / Ctrl+C
      state.mode = "list"; state.input = ""; state.wizard = null;
      return render();
    }
    if (ch === "\r") return state.mode === "create" ? advanceWizard() : submitModal();
    if (ch === "\x7f" || ch === "\b") {
      state.input = state.input.slice(0, -1);
      return render();
    }
    if (ch && /^[\x20-\x7e]$/.test(ch)) {
      // Passwords keep their case/symbols; identifiers are lowercased.
      const st = state.wizard?.steps[state.wizard.idx];
      state.input += st?.mask ? ch : ch.toLowerCase();
      return render();
    }
    return;
  }

  // Logs tab
  if (state.view === "logs") {
    const L = state.logs;
    if (seq === "\x1b" || ch === "\t" || ch?.toLowerCase() === "l") {
      closeLogs();
      return render();
    }
    if (seq === "\x1b[A" && L) { L.follow = false; L.scroll = Math.max(0, L.scroll - 1); return render(); }
    if (seq === "\x1b[B" && L) { L.scroll += 1; return render(); } // render clamps
    if (seq === "\x1b[5~" && L) { L.follow = false; L.scroll = Math.max(0, L.scroll - (L.viewH || 10)); return render(); } // PgUp
    if (seq === "\x1b[6~" && L) { L.scroll += (L.viewH || 10); return render(); } // PgDn (render clamps)
    if (seq === "\x1b[15~") return reloadLogs(); // F5
    switch (ch?.toLowerCase()) {
      case "q": return quit();
      case "\x03": return quit(); // Ctrl+C
      case "a": { // toggle scope: one tenant ↔ every pm2 process
        const sel = state.rows[state.selected];
        return void openLogs(L?.name ? null : (sel?.name || null));
      }
      case "f": if (L) { L.follow = true; render(); } return;
    }
    return;
  }

  switch (seq) {
    case "\x1b[A": state.selected = Math.max(0, state.selected - 1); return render();
    case "\x1b[B": state.selected = Math.min(state.rows.length - 1, state.selected + 1); return render();
    case "\x1b[D": state.colOff = Math.max(0, (state.colOff || 0) - 1); return render(); // ← show columns to the left
    case "\x1b[C": state.colOff = (state.colOff || 0) + 1; return render(); // → show columns to the right (render clamps)
    case "\x1b[5~": state.selected = Math.max(0, state.selected - (state.tableH || 10)); return render(); // PgUp
    case "\x1b[6~": state.selected = Math.min(state.rows.length - 1, state.selected + (state.tableH || 10)); return render(); // PgDn
    case "\x1b[H": case "\x1b[1~": state.selected = 0; return render(); // Home
    case "\x1b[F": case "\x1b[4~": state.selected = Math.max(0, state.rows.length - 1); return render(); // End
    case "\x1b[15~": return run("refresh"); // F5
  }
  if (ch === "\t") return run("logs");
  if (ch === "L") return run("logs-all"); // shift+L → merged stream of ALL processes
  switch (ch?.toLowerCase()) {
    case "q": return quit();
    case "\x03": return quit(); // Ctrl+C
    case "j": state.selected = Math.min(state.rows.length - 1, state.selected + 1); return render();
    case "k": state.selected = Math.max(0, state.selected - 1); return render();
    case "s": return run("start");
    case "t": return run("stop");
    case "r": return run("restart");
    case "o": return run("open");
    case "l": return run("logs");
    case "p": return run("mode");
    case "n": return run("new");
    case "u": return run("unregister");
    case "d": return run("destroy");
    case "\r": return run("refresh");
  }
}

export function onData(buf) {
  // A single chunk can carry several events (fast typing, paste, queued
  // mouse events) — consume it token by token instead of assuming 1 chunk
  // = 1 keypress.
  let s = buf.toString("utf8");
  while (s.length) {
    const mouse = s.match(/^\x1b\[<\d+;\d+;\d+[Mm]/);
    if (mouse) { handleMouse(mouse[0]); s = s.slice(mouse[0].length); continue; }
    const esc = s.match(/^\x1b\[\d*~|^\x1b\[[A-Z]/);
    if (esc) { handleKey(null, esc[0]); s = s.slice(esc[0].length); continue; }
    handleKey(s[0], s[0]);
    s = s.slice(1);
  }
}
