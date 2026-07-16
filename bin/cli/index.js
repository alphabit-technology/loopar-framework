#!/usr/bin/env node

/**
 * Loopar CLI — lifecycle for the project-local pm2 daemon.
 *
 * One module per command under commands/; shared pm2 plumbing in pm2.js.
 * Tenants resolve through tenant-builder.js — the same physical source the
 * Tenant Manager UI and the TUI use — so every surface manages the same
 * processes interchangeably. Prod/dev is a per-tenant switch (the tenant's
 * .env / the UI), never a separate command.
 *
 * Boot-time discipline: this entry imports NOTHING heavy. Bare `start` /
 * `tui` hand over to the TUI immediately (its spinner is on screen within
 * ~100ms); every other command is dynamically imported on demand, so a
 * `yarn stop x` never pays for the modules `start` needs.
 */
import { existsSync } from 'fs';
import { spawnSync, execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const [,, command, siteName] = process.argv;

// ─── Fast path: bare `start` / `tui` → the interactive TUI ─────────────────
if ((command === 'start' && !siteName) || command === 'tui') {
  if (process.stdout.isTTY && process.stdin.isTTY) {
    // ensure-site only matters on a fresh install — cheap fs check here, and
    // the child process only runs when sites/dev/.env is actually missing.
    if (!existsSync('sites/dev/.env')) {
      const ensure = fileURLToPath(new URL('../setup/ensure-site.js', import.meta.url));
      try { execFileSync(process.execPath, [ensure], { stdio: 'inherit' }); } catch (_) { /* TUI still opens */ }
    }
    const tui = fileURLToPath(new URL('../tui/index.js', import.meta.url));
    const { status } = spawnSync(process.execPath, [tui], { stdio: 'inherit' });
    process.exit(status ?? 0);
  }
  console.error('No interactive terminal — cannot open the TUI.');
  console.error('Headless usage: `yarn start all` (every production tenant) or `yarn start <site>`.');
  process.exit(1);
}

// ─── Everything else: load only the requested command ──────────────────────
const registry = {
  start:   () => import('./commands/start.js'),
  stop:    () => import('./commands/stop.js'),
  restart: () => import('./commands/restart.js'),
  delete:  () => import('./commands/delete.js'),
  kill:    () => import('./commands/kill.js'),
  watch:   () => import('./commands/watch.js'),
  startup: () => import('./commands/startup.js'),
  logs:    () => import('./commands/logs.js'),
  help:    () => import('./commands/help.js'),
};

const name = (!command || command === '--help' || command === '-h') ? 'help' : command;

if (!registry[name]) {
  console.error(`\n❌ Unknown command: ${command}\n`);
  const { default: help } = await registry.help();
  help();
  process.exit(1);
}

const { default: cmd } = await registry[name]();
await cmd(siteName);
