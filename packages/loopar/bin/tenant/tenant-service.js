'use strict';

/**
 * TenantService — process/infra orchestration for tenants.
 *
 * Extracted from the TenantManager entity (apps/loopar/.../tenant-manager.js)
 * so the SAME logic serves every consumer:
 *
 *   - TenantManager entity  → Desk UI + control plane (loopar.build)
 *   - bin/cli/              → command line
 *   - bin/tui/              → interactive TUI
 *
 * Nothing here touches Entity, BaseDocument or any database. Tenants are
 * resolved physically from sites/<name>/.env via tenant-builder.js, so this
 * module is safe to import in "bare mode" — no running tenant required.
 * The entity delegates to these functions; behavior is unchanged.
 */

import pm2 from 'pm2';
import fs from 'fs';
import path from 'pathe';
import { tenant } from './tenant-builder.js';
import CaddyManager from './caddy-manager.js';

const SITES_DIR = path.join(process.cwd(), 'sites');

export const SELF_ACTION_DELAY_MS = 400;

// ─── PM2 bus ────────────────────────────────────────────────────────────────
// pm2.connect is expensive and the library doesn't pool. We share a single
// bus across all callers via a refcount: the first withPm2Bus connects, the
// last disconnects, and the body functions (pm2Action) assume the bus is
// already open. (Same rationale as the original TenantManager.#withPm2Bus.)

let pm2Depth = 0;
let pm2OpenPromise = null;

export async function withPm2Bus(fn) {
  if (pm2Depth === 0) {
    pm2OpenPromise = new Promise((resolve, reject) => {
      pm2.connect(err => err ? reject(err) : resolve());
    });
    try {
      await pm2OpenPromise;
    } catch (err) {
      pm2OpenPromise = null;
      throw err;
    }
  } else if (pm2OpenPromise) {
    // Another caller is mid-connect — wait it out before piling on.
    await pm2OpenPromise;
  }
  pm2Depth++;
  try {
    return await fn();
  } finally {
    pm2Depth--;
    if (pm2Depth === 0) {
      try { pm2.disconnect(); } catch (_) { /* already gone */ }
      pm2OpenPromise = null;
    }
  }
}

export async function tenantStatus(name) {
  try {
    const desc = await new Promise((res, rej) =>
      pm2.describe(name, (e, d) => (e ? rej(e) : res(d)))
    );
    return desc[0]?.pm2_env?.status || 'stopped';
  } catch (_) {
    return 'stopped';
  }
}

/**
 * PM2 start config for a tenant, built from sites/<name>/.env — the same
 * shape the Tenant Manager UI and loopar-cli use: exec_mode cluster in
 * production, fork in development, 1 instance.
 */
export function startConfig(name) {
  const config = tenant.getTenantData(name, null);
  if (!config) return null;
  const NODE_ENV = config.env.NODE_ENV || 'development';
  config.exec_mode = NODE_ENV === 'production' ? 'cluster' : 'fork';
  config.instances = 1;
  return config;
}

/**
 * Run a PM2 action against a tenant. Assumes the bus is already open — call
 * inside a withPm2Bus block. Returns true/false; never throws on PM2-level
 * errors (they're logged).
 *
 * `selfTenantId`: when the acting process IS the target tenant (the Desk UI
 * managing itself), stop/restart are deferred so the HTTP response can leave
 * before the process dies. Bare-mode callers (CLI/TUI) pass nothing.
 */
export async function pm2Action(name, action, { selfTenantId = null } = {}) {
  return new Promise(resolve => {
    const finish = (success, message, err = null) => {
      if (err) { console.error(message, err); return resolve(false); }
      console.log(`${success ? '✅' : '❌'} ${name}: ${message}`);
      resolve(success);
    };

    const run = (fn, ok, fail) =>
      fn(e => e ? finish(false, fail, e) : finish(true, ok));

    const isSelf = selfTenantId != null && name === selfTenantId;

    (async () => {
      let config = null;
      if (action === 'start' || action === 'restart') {
        config = startConfig(name);
        if (!config) return finish(false, 'Tenant config not found');
      }

      switch (action) {
        case 'start':
          run(cb => pm2.start(config, cb), 'started', 'PM2 start failed');
          break;

        case 'restart':
          if (isSelf) {
            setTimeout(() => pm2.reload(name, () => {}), SELF_ACTION_DELAY_MS);
            finish(true, 'restart→reload (self; env changes need external restart)');
          } else {
            pm2.delete(name, () =>
              run(cb => pm2.start(config, cb), 'restarted', 'PM2 restart failed')
            );
          }
          break;

        case 'reload':
          if (isSelf) {
            setTimeout(() => pm2.reload(name, () => {}), SELF_ACTION_DELAY_MS);
            finish(true, 'reload triggered (self)');
          } else {
            run(cb => pm2.reload(name, cb), 'reloaded', 'PM2 reload failed');
          }
          break;

        case 'stop':
          if (isSelf) {
            setTimeout(() => pm2.stop(name, () => {}), SELF_ACTION_DELAY_MS);
            finish(true, 'stop triggered (self) — session will disconnect');
          } else {
            run(cb => pm2.stop(name, cb), 'stopped', 'PM2 stop failed');
          }
          break;

        default:
          run(cb => pm2[action](name, cb), `${action} done`, `PM2 ${action} failed`);
          break;
      }
    })();
  });
}

/**
 * Probe a tenant's HTTP server until it answers (or we run out of attempts).
 * Any non-5xx response counts — the tenant might 404 or 302 before install
 * but the listener is up, which is all provision() needs before firing the
 * install POST.
 */
export async function waitForHttp(domain, port, { maxAttempts = 30, delayMs = 1000 } = {}) {
  const url = `http://${domain}:${port}/`;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const r = await fetch(url, { method: 'HEAD' });
      if (r.status < 500) return true;
    } catch (_) {
      // Connection refused / DNS / etc. — keep waiting.
    }
    await new Promise(r => setTimeout(r, delayMs));
  }
  return false;
}

/**
 * POST to a tenant's installer endpoint. The capital `S` in
 * `/api/System/install` matters — middleware.js gates `/api/System/*` from
 * the "not-installed" redirect so the request actually reaches the
 * controller; lowercase `/api/system/*` would bounce to the install page
 * and the POST would never execute.
 */
export async function runRemoteInstall({ domain, port, payload = {}, headers = {} }) {
  const url = `http://${domain}:${port}/api/System/install?app_name=loopar`;
  const body = {
    email:            payload.email            || '',
    company:          payload.company          || '',
    admin_password:   payload.admin_password   || '',
    confirm_password: payload.confirm_password || '',
    ...payload,
  };
  const r = await fetch(url, {
    method:   'POST',
    headers:  {
      'Content-Type': 'application/json',
      // Caller-supplied headers go last so they can override defaults
      // (e.g. X-Install-Token for cloud-provisioned tenants).
      ...headers,
    },
    body:     JSON.stringify(body),
    // The install controller ends with `return this.redirect("view")` —
    // we don't want to follow that (it points to /desk which requires
    // auth we don't have from here).
    redirect: 'manual',
  });
  if (r.status >= 400) {
    const txt = await r.text().catch(() => '<no body>');
    throw new Error(`Install returned ${r.status}: ${txt.slice(0, 400)}`);
  }
  return { status: r.status };
}

/**
 * End-to-end tenant bring-up. Writes the .env once (merging any custom
 * keys), optionally seeds `db.config.json` from a source tenant so the new
 * workspace skips `/loopar/system/connect`, brings Caddy + PM2 online, waits
 * for the HTTP server to answer, and finally runs the standard Loopar
 * installer over the network.
 *
 * @param {object}  data          Tenant identity + raw field values.
 * @param {string}  data.name
 * @param {string?} data.id
 * @param {number|string} data.port
 * @param {string?} data.domain
 * @param {object}  data.raw      Extra fields to persist in the .env
 *                                (the entity passes rawValues()).
 * @param {object}  opts          Same options as TenantManager.provision():
 *                                env, dbConfigFrom, install, installPayload,
 *                                installHeaders, waitMaxAttempts, waitDelayMs,
 *                                onProgress. Plus onEnvWritten — internal
 *                                hook the entity uses to flip __IS_NEW__ at
 *                                the same point the original code did.
 * @returns {Promise<{url:string, dbName:string|null}>}
 */
export async function provision(data, {
  env = {},
  dbConfigFrom = null,
  install = true,
  installPayload = {},
  installHeaders = {},
  waitMaxAttempts = 30,
  waitDelayMs = 1000,
  onProgress = null,
  onEnvWritten = null,
} = {}) {
  const { name, id = null, port, domain = null, raw = {} } = data;
  const log = (step, payload = {}) => {
    try { onProgress?.(step, payload); } catch (_) { /* never throw from progress */ }
  };

  // 1) Write the canonical .env once, with any custom keys merged in.
  //    saveTenant() preserves arbitrary keys via its merge, so a second
  //    pass through the desk's save()/initInstance() (if it ever happens)
  //    won't strip CUSTOMER_EMAIL etc.
  log('writing-env', { port, domain });
  await tenant.saveTenant({
    ...raw,
    NAME: name,
    ID: id || name,
    ...env,
  });
  try { onEnvWritten?.(); } catch (_) { /* entity bookkeeping only */ }

  // 2) Seed db.config.json so the new tenant skips `/system/connect`.
  let dbName = null;
  if (dbConfigFrom) {
    try {
      dbName = await tenant.saveDbConfig({ from: dbConfigFrom, to: name });
    } catch (err) {
      // Surface but don't swallow: without a DB config the tenant will
      // boot into the connect wizard, which the cloud flow explicitly
      // avoids.
      throw new Error(`saveDbConfig from "${dbConfigFrom}" failed: ${err.message}`);
    }
  }

  // 3) Caddy + PM2.
  log('starting', { port, domain });
  const hasDomain = !!domain?.trim();
  if (hasDomain) {
    const caddy = new CaddyManager();
    try {
      await caddy.ensureReady();
      const registered = await caddy.registerTenant(domain, port);
      if (!registered) throw new Error('Could not register tenant in Caddy');
    } catch (err) {
      throw new Error(err.message || 'Caddy configuration failed');
    }
  }
  const started = await withPm2Bus(() => pm2Action(name, 'start'));
  if (!started) throw new Error('PM2 start failed');

  // 4) Wait for the HTTP server to answer (any non-5xx is "alive").
  log('waiting-http', { port, domain });
  const ready = await waitForHttp(domain, port, {
    maxAttempts: waitMaxAttempts,
    delayMs:     waitDelayMs,
  });
  if (!ready) {
    throw new Error(`Tenant did not become reachable on ${domain}:${port}`);
  }

  // 5) Trigger the standard Loopar installer in the new tenant. Skipped
  //    when the caller already plans to install manually.
  if (install) {
    log('installing-loopar', { port, domain });
    await runRemoteInstall({ domain, port, payload: installPayload, headers: installHeaders });
  }

  return {
    url: tenant.tenantUrl(name, { domain, port }),
    dbName,
  };
}

/**
 * Teardown counterpart to provision(). Stops PM2, drops the process from
 * PM2's registry, unregisters the Caddy route, and (by default) removes the
 * `sites/<name>/` directory. Idempotent — every step is wrapped to ignore
 * "already gone" errors so callers can use this from cleanup crons without
 * pre-checking.
 */
export async function destroy(name, { domain = null, removePath = true, selfTenantId = null } = {}) {
  // Open the PM2 bus once for both calls instead of connecting/disconnecting
  // twice (and racing pm2.describe calls from elsewhere in the process).
  await withPm2Bus(async () => {
    try { await pm2Action(name, 'stop',   { selfTenantId }); } catch (_) {}
    try { await pm2Action(name, 'delete', { selfTenantId }); } catch (_) {}
  });
  if (domain) {
    try { await new CaddyManager().removeTenant(domain); } catch (_) {}
  }
  if (removePath) {
    const sitePath = path.join(SITES_DIR, name);
    if (fs.existsSync(sitePath)) {
      try {
        fs.rmSync(sitePath, { recursive: true, force: true });
        console.log(`[TenantService] removed sites/${name}`);
      } catch (err) {
        console.error(`[TenantService] rm ${sitePath}:`, err.message);
      }
    }
  }
  return true;
}
