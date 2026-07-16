/**
 * Shared PM2 plumbing for the CLI commands.
 *
 * Tenants are resolved through the SAME source the Tenant Manager UI and the
 * TUI use (loopar/bin/tenant/tenant-builder.js): process name = tenant id
 * (plain, no project prefix), namespace = basename(cwd), start config built
 * from the tenant's sites/<name>/.env (exec_mode cluster in production, fork
 * in development, instances 1). Anything else drifts from what the UI starts
 * and targets processes that don't exist.
 */
import "loopar/bin/pm2-home.js";
import { tenants, getTenantData } from "loopar/bin/tenant/tenant-builder.js";
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

// ─── tenant resolution (mirrors TenantManager / tenant-service) ─────────────

export const siteNames = () => tenants().map(t => t.name);
export const productionSites = () =>
  tenants().filter(t => t.env.NODE_ENV === 'production').map(t => t.name);

export function tenantConfig(name) {
  let config = null;
  try { config = getTenantData(name); } catch (_) { /* not found */ }
  if (!config) {
    console.error(chalk.red(`❌ Tenant "${name}" not found in sites/.`));
    console.error(chalk.gray(`   Available: ${siteNames().join(', ') || '(none)'}`));
    return null;
  }
  const isProduction = (config.env.NODE_ENV || 'development') === 'production';
  config.exec_mode = isProduction ? 'cluster' : 'fork';
  config.instances = 1;
  return config;
}

// ─── programmatic pm2 (same API path the Tenant Manager UI uses) ────────────

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

export const startTenant = async (name) => {
  const config = tenantConfig(name);
  if (!config) return false;
  console.log(chalk.cyan(`Starting ${name} (${config.env.NODE_ENV || 'development'})...`));
  return await pm2Do(pm2.start, config);
};

// Env changes only apply on a fresh start — mirror the UI's external restart:
// delete the process, then start it again with a freshly-built config.
export const restartTenant = async (name) => {
  const config = tenantConfig(name);
  if (!config) return false;
  console.log(chalk.cyan(`Restarting ${name}...`));
  await new Promise(res => pm2.delete(name, () => res())); // may not exist — fine
  return await pm2Do(pm2.start, config);
};

export const pm2Stop = (name) => withPm2(() => pm2Do(pm2.stop, name));
export const pm2Delete = (name) => withPm2(() => pm2Do(pm2.delete, name));
