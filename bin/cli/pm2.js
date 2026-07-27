/**
 * Shared PM2 for the CLI commands.
 *
 * Single-core model: PM2 supervises ONE process — the core (`loopar-core`),
 * which serves every tenant in-process. No per-tenant processes. Namespace =
 * basename(cwd); the core's config comes from config/core.json.
 */
import "loopar/bin/pm2-home.js";
import { execSync } from 'child_process';
import path from 'path';
import chalk from 'chalk';
import pm2 from 'pm2';

export const projectPath = process.cwd();
export const projectName = path.basename(projectPath);   // == tenant-builder's namespace

/**
 * Run a shell command and return success as a boolean.
 * Note: with stdio:'inherit' execSync returns null on success too, so we
 * can't infer success from the return value — only the absence of a thrown
 * error means it worked.
 */
export function pm2Command(cmd, silent = false) {
  try {
    execSync(cmd, {
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf8'
    });
    return true;
  } catch (err) {
    if (!silent) {
      console.error(chalk.red(`Error: ${err}`));
    }
    return false;
  }
}

// ─── programmatic pm2 ---

const pm2Connect = () => new Promise((res, rej) => pm2.connect(e => e ? rej(e) : res()));
const pm2Do = (fn, arg) => new Promise(res =>
  fn.call(pm2, arg, err => {
    if (err) { console.error(chalk.red(`❌ ${err.message || err}`)); res(false); }
    else res(true);
  })
);

export async function withPm2(fn) {
  await pm2Connect();
  try { return await fn(); }
  finally { try { pm2.disconnect(); } catch (_) { /* already gone */ } }
}

// Start an arbitrary pm2 process config (non-tenant helpers like build-watch).
export const startProcess = (config) => pm2Do(pm2.start, config);

// ─── single execution model: the core process ─────────────

import { corePort, coreEnv, coreEnvVars } from 'loopar/core/config/core-config.js';
export { corePort, coreEnv };

export const CORE_PROCESS_NAME = 'loopar-core';

/**
 * PM2 config for THE core process — the generator. One process, tenant-less,
 * serves every tenant in-process. Cluster in production for multi-core;
 * fork in development. Its env is populated from config/core.json.
 */
export function coreConfig() {
  return {
    name: CORE_PROCESS_NAME,
    namespace: projectName,
    script: 'node_modules/loopar/bin/core.js',
    exec_mode: coreEnv() === 'production' ? 'cluster' : 'fork',
    instances: 1,
    env: coreEnvVars(),
  };
}

/** Start the core process (the generator). No tenant is loaded. */
export const startCoreProcess = async () => {
  const config = coreConfig();
  console.log(chalk.cyan(`Starting core "${config.name}" (${config.env.NODE_ENV}) on :${config.env.PORT} — serves all tenants`));
  return await pm2Do(pm2.start, config);
};

/** Restart the core (delete + fresh start so config/core.json is re-read). */
export const restartCoreProcess = async () => {
  await new Promise((res) => pm2.delete(CORE_PROCESS_NAME, () => res()));
  return startCoreProcess();
};

/** PM2 status of the core process: 'online' | 'stopped' | 'errored' | … */
export const coreProcessStatus = () =>
  withPm2(() => new Promise((res) =>
    pm2.describe(CORE_PROCESS_NAME, (e, d) =>
      res(e ? 'stopped' : (d?.[0]?.pm2_env?.status || 'stopped')))));
