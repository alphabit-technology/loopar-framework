#!/usr/bin/env node

/**
 * Loopar TUI — interactive tenant manager for the terminal.
 *
 * Same data source as the Tenant Manager UI and the CLI: tenants are read
 * PHYSICALLY from sites/<name>/.env via tenant-builder.js, and all PM2/Caddy
 * orchestration comes from tenant-service.js — the SAME module the
 * TenantManager entity (Desk UI / loopar.build) delegates to. No tenant
 * process, no Entity, no database is needed to run this ("bare mode").
 *
 * Scope: lifecycle + inspection (list/status/start/stop/restart/create/
 * unregister/destroy, prod⇄dev switch, open-in-browser, log tail). Installing
 * a tenant is deliberately left to the tenant's own browser wizard
 * (connect → install) — the canonical first-boot flow.
 *
 * Modules:
 *   term.js    ANSI, screen lifecycle, quit
 *   state.js   shared mutable state
 *   render.js  frame drawing + clickable regions (tenants + logs tabs)
 *   actions.js tenant actions, dispatcher, wizard/confirm flows
 *   logs.js    log-tail tab (fs tail of PM2_HOME/logs, no pm2 bus to read)
 *   input.js   keyboard + SGR mouse decoding
 *
 * Usage:
 *   node bin/tui/index.js          interactive TUI (or: yarn start / yarn tui)
 *   node bin/tui/index.js --list   print tenants as JSON and exit (no TTY)
 *
 * Env:
 *   LOOPAR_TUI_NO_PM2=1   never touch PM2 (statuses show as "n/a")
 */

// ─── Boot feedback ──────────────────────────────────────────────────────────
// The heavy imports below (pm2 → tenant-service → caddy) take a couple of
// seconds on a cold start. With STATIC imports they'd run before any of our
// code — nothing on screen, looks like a hang. So: print a spinner first,
// then load everything dynamically. enterScreen() switches to the alternate
// buffer, which wipes the spinner line cleanly.

const IS_LIST = process.argv.includes("--list");
let bootTimer = null;

if (!IS_LIST && process.stdout.isTTY) {
  const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
  let i = 0;
  const draw = () =>
    process.stdout.write(`\r \x1b[36m${frames[i = (i + 1) % frames.length]}\x1b[0m \x1b[36m◆ LOOPAR\x1b[0m starting tenant manager… `);
  draw();
  bootTimer = setInterval(draw, 80);
}

await import("loopar/bin/pm2-home.js");
const { enterScreen, exitScreen, quit } = await import("./term.js");
const { state, NO_PM2 } = await import("./state.js");
const { render } = await import("./render.js");
const { loadRows, actions } = await import("./actions.js");
const { onData } = await import("./input.js");

if (bootTimer) {
  clearInterval(bootTimer);
  process.stdout.write("\r\x1b[2K"); // clear the spinner line
}

async function main() {
  // Non-interactive mode for scripts / testing: --list prints JSON and exits.
  if (IS_LIST) {
    await loadRows();
    console.log(JSON.stringify(state.rows, null, 2));
    process.exit(0);
  }

  if (!process.stdout.isTTY || !process.stdin.isTTY) {
    console.error("loopar-tui needs an interactive terminal (or use --list).");
    process.exit(1);
  }

  enterScreen();
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on("data", onData);
  process.stdout.on("resize", render);
  process.on("SIGINT", () => quit());
  process.on("SIGTERM", () => quit());

  state.message = "loading tenants...";
  await loadRows(false);
  render();

  // Statuses arrive async so the UI paints instantly even if PM2 is cold.
  await loadRows();

  // First-boot fast path: exactly one tenant and it's stopped — the state
  // right after a fresh install (ensure-site creates `dev`). Start it
  // without asking so `yarn start` lands on a running site, wizard included.
  // With several tenants (or an errored one) the TUI stays a status panel
  // and never starts anything on its own.
  if (!NO_PM2 && state.rows.length === 1 && state.rows[0].status === "stopped") {
    const only = state.rows[0];
    state.busy = true;
    state.message = `only tenant is stopped — starting ${only.name}...`;
    render();
    try {
      const msg = await actions.start(only.name);
      state.message = msg;
      state.messageKind = /fail/i.test(msg) ? "error" : "ok";
    } catch (err) {
      state.message = err.message || String(err);
      state.messageKind = "error";
    }
    await loadRows();
    state.busy = false;
  } else {
    state.message = "ready · [o] open · [l] logs · [L] all logs · [p] prod/dev";
    state.messageKind = "info";
  }
  render();

  // Keep statuses fresh (the logs tab has its own poll in logs.js).
  setInterval(async () => {
    if (state.busy || state.mode !== "list" || state.view !== "tenants") return;
    await loadRows();
    render();
  }, 4000);
}

main().catch((err) => {
  exitScreen();
  console.error(err);
  process.exit(1);
});
