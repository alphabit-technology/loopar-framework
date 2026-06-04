'use strict';

import "loopar/bin/pm2-home.js";
import { BaseDocument, tenant } from 'loopar';

import { loopar } from 'loopar';
import { promisify } from 'util';
import pm2 from "pm2";
import fs from "fs";
import path from "pathe";
import CaddyManager from "./caddy-manager.js";

const tenantsDir   = path.join(process.cwd(), 'sites');
const pm2Describe  = promisify(pm2.describe.bind(pm2));

const tenantStatus = async (tenant) => {
  try {
    const desc = await pm2Describe(tenant.name);
    return desc[0]?.pm2_env?.status || "stopped";
  } catch (_) {
    return "stopped";
  }
};

export default class TenantManager extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async __init__(ifNotFound) {
    if (this.__DOCUMENT_NAME__) {
      const app = tenant.getTenantData(this.__DOCUMENT_NAME__);
      if (app || ifNotFound == "new") {
        this.__DATA__ = {
          ...this.__DATA__,
          id: app.name,
          port: app.env.PORT,
          domain: app.env.DOMAIN,
          node_env: app.env.NODE_ENV,
        };
        this.__IS_NEW__ = false;
      } else if (ifNotFound === 'throw') {
        loopar.throw({ code: 404, message: `${ENTITY.name} ${this.__DOCUMENT_NAME__}: not found...` });
      } else if (ifNotFound === "null"){
        return null;
      }
    }

    await super.__init__();
    if (this.__DOCUMENT_NAME__) this.name = this.__DOCUMENT_NAME__;
    this.caddy = new CaddyManager();
  }

  get allApps() { return tenant.tenants(); }

  async getStatus()  { return await tenantStatus(this); }
  async __data__()   { return tenant.getTenantData(this.name); }

  async isDomainInUse(domain) {
    const routes = await this.caddy._readCurrentRoutes();
    const match  = routes.find(r => r.match?.some(m => m.host?.includes(domain)));
    if (!match) return false;
    const dial = match.handle?.[0]?.upstreams?.[0]?.dial;
    const port = dial?.match(/localhost:(\d+)/)?.[1];
    return port ? parseInt(port) !== parseInt(this.port) : false;
  }

  async disconnectDomain() {
    const envFile = path.join(tenantsDir, this.name, '.env');

    if (fs.existsSync(envFile)) {
      const oldDomain = fs.readFileSync(envFile, 'utf8').match(/^DOMAIN=(.+)$/m)?.[1]?.trim();
      if (oldDomain && oldDomain !== this.domain) {
        await this.caddy.removeTenant(oldDomain);
      }
    }

    if (await this.isDomainInUse(this.domain)) {
      if (this.force_connect !== 1) {
        return loopar.throw("Domain already in use. Try another domain or enable force connect to override.");
      }
      await this.caddy.removeTenant(this.domain);
    }
  }

  async removeDomain(domain) {
    if (!domain) return;
    await this.caddy.removeTenant(domain);
  }

  async save() {
    await this.validate();
  
    if (this.__IS_NEW__ && this.allApps.find(a => a.name === this.name)) {
      return loopar.throw("Tenant already exists, try another name");
    }
  
    await this.disconnectDomain();
    await tenant.saveTenant({...await this.rawValues(), ID: this.id || this.name});
  
    if (await this.getStatus() === "online") await this.restart();
  
    return true;
  }

  async setOnDevelopment() { return await this.#setEnvironment("development"); }
  async setOnProduction()  { return await this.#setEnvironment("production");  }

  async #setEnvironment(mode) {
    this.node_env = mode;
    await this.save();
    return true;
  }

  async start() {
    await this.initInstance();
    return this;
  }

  async stop() {
    return await TenantManager.#withPm2Bus(() => this.#pm2Action("stop"));
  }

  async restart() {
    const restarted = await TenantManager.#withPm2Bus(() => this.#pm2Action("restart"));
    if (restarted && this.domain) {
      await this.removeDomain(this.domain);
      await this.caddy.registerTenant(this.domain, this.port);
    }
    return restarted;
  }

  async reload() {
    return await TenantManager.#withPm2Bus(() => this.#pm2Action("reload"));
  }

  validateDomain(domain) {
    if (typeof domain !== "string") return false;
    domain = domain.trim().toLowerCase();

    if (domain.endsWith('.localhost') || domain === 'localhost') {
      return /^(?!-)([a-z0-9-]{1,63}\.)*localhost$/.test(domain);
    }
    return /^(?!-)(?:[a-z0-9-]{1,63}\.)+[a-z]{2,63}$/.test(domain);
  }

  async validate() {
    if (this.domain?.trim()) {
      if (!this.validateDomain(this.domain)) {
        return loopar.throw("Invalid domain");
      }
      const conflict = this.allApps.find(
        a => a.env.DOMAIN === this.domain && a.name !== this.name
      );
      if (conflict) {
        return loopar.throw(`Domain ${this.domain} is already used by tenant ${conflict.name}`);
      }
    }
    await super.validate();
  }

  #hasDomain() { return !!this.domain?.trim(); }

  async initInstance() {
    await this.validate();
    await this.save();

    const hasDomain = this.#hasDomain();

    console.log(`\n${'─'.repeat(40)}`);
    console.log(`Tenant: ${this.name}  |  Port: ${this.port}  |  Domain: ${this.domain || '—'}`);
    console.log(`${'─'.repeat(40)}\n`);

    if (hasDomain) {
      try {
        await this.caddy.ensureReady();
        const registered = await this.caddy.registerTenant(this.domain, this.port);
        if (!registered) return loopar.throw("Could not register tenant in Caddy.");
      } catch (err) {
        return loopar.throw(err.message || "Caddy configuration failed");
      }
    }

    await TenantManager.#withPm2Bus(() => this.#pm2Action("start"));

    console.log(`\n✅ ${this.name} ready`);
    console.log(`   ${hasDomain ? `http://${this.domain}` : `http://localhost:${this.port}`}\n`);

    return true;
  }

  /**
   * End-to-end tenant bring-up for cloud / SaaS callers (the control plane's
   * provisioning flow). Writes the .env once (merging any custom keys), seeds
   * `db.config.json` from a source tenant so the new workspace skips
   * `/loopar/system/connect`, brings Caddy + PM2 online, waits for the HTTP
   * server to answer, and finally runs the standard Loopar installer over
   * the network.
   *
   * Unlike `initInstance()` (which goes through `save()` and is meant for the
   * desk UI), `provision()` writes the .env directly so callers can stash
   * extra env keys (CUSTOMER_EMAIL, CLOUD_VERIFIER_*) in a single pass
   * without tripping the desk-side `__IS_NEW__` uniqueness guard.
   *
   * @param {object}   opts
   * @param {object}   opts.env             Extra `.env` keys to merge in.
   * @param {string?}  opts.dbConfigFrom    Source tenant to clone db.config.json from.
   * @param {boolean}  opts.install         Run `/api/System/install` once HTTP is up.
   * @param {object}   opts.installPayload  Body sent to the installer.
   * @param {object}   opts.installHeaders  Extra HTTP headers for the install
   *                                        POST (e.g. X-Install-Token).
   * @param {number}   opts.waitMaxAttempts HTTP-ready poll attempts.
   * @param {number}   opts.waitDelayMs     Delay between attempts (ms).
   * @param {function} opts.onProgress      `(step, payload) => void` callback.
   * @returns {Promise<{url:string, dbName:string|null}>}
   */
  async provision({
    env = {},
    dbConfigFrom = null,
    install = true,
    installPayload = {},
    installHeaders = {},
    waitMaxAttempts = 30,
    waitDelayMs = 1000,
    onProgress = null,
  } = {}) {
    const log = (step, payload = {}) => {
      try { onProgress?.(step, payload); } catch (_) { /* never throw from progress */ }
    };

    await this.validate();

    // 1) Write the canonical .env once, with any custom keys merged in.
    //    saveTenant() preserves arbitrary keys via its merge, so a second
    //    pass through the desk's save()/initInstance() (if it ever happens)
    //    won't strip CUSTOMER_EMAIL etc.
    log('writing-env', { port: this.port, domain: this.domain });
    await tenant.saveTenant({
      ...await this.rawValues(),
      ID: this.id || this.name,
      ...env,
    });
    // Mark as existing so a subsequent save() doesn't re-run the uniqueness
    // guard against the very directory we just wrote.
    this.__IS_NEW__ = false;

    // 2) Seed db.config.json so the new tenant skips `/system/connect`.
    let dbName = null;
    if (dbConfigFrom) {
      try {
        dbName = await tenant.saveDbConfig({ from: dbConfigFrom, to: this.name });
      } catch (err) {
        // Surface but don't swallow: without a DB config the tenant will
        // boot into the connect wizard, which the cloud flow explicitly
        // avoids.
        throw new Error(`saveDbConfig from "${dbConfigFrom}" failed: ${err.message}`);
      }
    }

    // 3) Caddy + PM2 — same wiring initInstance() runs, but inline (we've
    //    already written the env; we don't want save() to run again).
    log('starting', { port: this.port, domain: this.domain });
    const hasDomain = this.#hasDomain();
    if (hasDomain) {
      try {
        await this.caddy.ensureReady();
        const registered = await this.caddy.registerTenant(this.domain, this.port);
        if (!registered) throw new Error('Could not register tenant in Caddy');
      } catch (err) {
        throw new Error(err.message || 'Caddy configuration failed');
      }
    }
    const started = await TenantManager.#withPm2Bus(() => this.#pm2Action('start'));
    if (!started) throw new Error('PM2 start failed');

    // 4) Wait for the HTTP server to answer (any non-5xx is "alive").
    log('waiting-http', { port: this.port, domain: this.domain });
    const ready = await TenantManager.#waitForHttp(this.domain, this.port, {
      maxAttempts: waitMaxAttempts,
      delayMs:     waitDelayMs,
    });
    if (!ready) {
      throw new Error(`Tenant did not become reachable on ${this.domain}:${this.port}`);
    }

    // 5) Trigger the standard Loopar installer in the new tenant. Skipped
    //    when the caller already plans to install manually.
    if (install) {
      log('installing-loopar', { port: this.port, domain: this.domain });
      await TenantManager.#runRemoteInstall({
        domain:  this.domain,
        port:    this.port,
        payload: installPayload,
        headers: installHeaders,
      });
    }

    return {
      url:    tenant.tenantUrl(this.name, { domain: this.domain, port: this.port }),
      dbName,
    };
  }

  /**
   * Teardown counterpart to `provision()`. Stops PM2, drops the process
   * from PM2's registry, unregisters the Caddy route, and (by default)
   * removes the `sites/<name>/` directory. Idempotent — every step is
   * wrapped to ignore "already gone" errors so callers can use this from
   * cleanup crons without pre-checking.
   *
   * @param {object}  opts
   * @param {boolean} opts.removePath  When false, the on-disk directory is
   *                                   kept (operator can inspect / revive).
   */
  async destroy({ removePath = true } = {}) {
    // Open the PM2 bus once for both calls instead of connecting/disconnecting
    // twice (and racing the `pm2.describe` calls that getStatus() makes from
    // elsewhere in the process).
    await TenantManager.#withPm2Bus(async () => {
      try { await this.#pm2Action('stop'); }   catch (_) {}
      try { await this.#pm2Action('delete'); } catch (_) {}
    });
    if (this.domain) {
      try { await this.removeDomain(this.domain); } catch (_) {}
    }
    if (removePath) {
      const sitePath = path.join(tenantsDir, this.name);
      if (fs.existsSync(sitePath)) {
        try {
          fs.rmSync(sitePath, { recursive: true, force: true });
          console.log(`[TenantManager] removed sites/${this.name}`);
        } catch (err) {
          console.error(`[TenantManager] rm ${sitePath}:`, err.message);
        }
      }
    }
    return true;
  }

  /**
   * Probe the new tenant's HTTP server until it answers (or we run out of
   * attempts). Any non-5xx response counts — the tenant might 404 or 302
   * before install but the listener is up, which is all `provision()` needs
   * before firing the install POST.
   */
  static async #waitForHttp(domain, port, { maxAttempts = 30, delayMs = 1000 } = {}) {
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
   * POST to the new tenant's installer endpoint. The capital `S` in
   * `/api/System/install` matters — middleware.js gates `/api/System/*`
   * from the "not-installed" redirect so the request actually reaches the
   * controller; lowercase `/api/system/*` would bounce to the install
   * page and our POST would never execute.
   */
  static async #runRemoteInstall({ domain, port, payload = {}, headers = {} }) {
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

  static SELF_ACTION_DELAY_MS = 400;

  // pm2.connect is expensive and the library doesn't pool. Before this
  // refactor every #pm2Action opened+closed the bus, so a chain like
  // `provision()` (start) → `destroy()` (stop + delete) reconnected three
  // times and any in-flight `pm2.describe` from getStatus could race the
  // disconnect mid-call. We share a single bus across the class via a
  // refcount: the first withPm2Bus connects, the last disconnects, and the
  // body methods (#pm2Action) assume the bus is already open.
  static #pm2Depth = 0;
  static #pm2OpenPromise = null;

  static async #withPm2Bus(fn) {
    if (TenantManager.#pm2Depth === 0) {
      TenantManager.#pm2OpenPromise = new Promise((resolve, reject) => {
        pm2.connect(err => err ? reject(err) : resolve());
      });
      try {
        await TenantManager.#pm2OpenPromise;
      } catch (err) {
        TenantManager.#pm2OpenPromise = null;
        throw err;
      }
    } else if (TenantManager.#pm2OpenPromise) {
      // Another caller is mid-connect — wait it out before piling on.
      await TenantManager.#pm2OpenPromise;
    }
    TenantManager.#pm2Depth++;
    try {
      return await fn();
    } finally {
      TenantManager.#pm2Depth--;
      if (TenantManager.#pm2Depth === 0) {
        try { pm2.disconnect(); } catch (_) { /* already gone */ }
        TenantManager.#pm2OpenPromise = null;
      }
    }
  }

  // Assumes the PM2 bus is already open — call inside a #withPm2Bus block.
  // Returns true/false; never throws on PM2-level errors (they're logged).
  async #pm2Action(action) {
    return new Promise(resolve => {
      const finish = (success, message, err = null) => {
        if (err) { console.error(message, err); return resolve(false); }
        console.log(`${success ? '✅' : '❌'} ${this.name}: ${message}`);
        resolve(success);
      };

      const run = (fn, ok, fail) =>
        fn(e => e ? finish(false, fail, e) : finish(true, ok));

      const isSelf = this.name === loopar.tenantId;

      (async () => {
        let config = null;
        if (action === "start" || action === "restart") {
          config = await this.__data__();
          if (!config) return finish(false, "Tenant config not found");
          const NODE_ENV = config.env.NODE_ENV || "development";
          const isProduction = NODE_ENV === 'production';
          config.exec_mode = isProduction ? 'cluster' : 'fork';
          config.instances = 1;
        }

        switch (action) {
          case "start":
            run(cb => pm2.start(config, cb), "started", "PM2 start failed");
            break;

          case "restart":
            if (isSelf) {
              setTimeout(() => pm2.reload(this.name, () => {}), TenantManager.SELF_ACTION_DELAY_MS);
              finish(true, "restart→reload (self; env changes need external restart)");
            } else {
              pm2.delete(this.name, () =>
                run(cb => pm2.start(config, cb), "restarted", "PM2 restart failed")
              );
            }
            break;

          case "reload":
            if (isSelf) {
              setTimeout(() => pm2.reload(this.name, () => {}), TenantManager.SELF_ACTION_DELAY_MS);
              finish(true, "reload triggered (self)");
            } else {
              run(cb => pm2.reload(this.name, cb), "reloaded", "PM2 reload failed");
            }
            break;

          case "stop":
            if (isSelf) {
              setTimeout(() => pm2.stop(this.name, () => {}), TenantManager.SELF_ACTION_DELAY_MS);
              finish(true, "stop triggered (self) — session will disconnect");
            } else {
              run(cb => pm2.stop(this.name, cb), "stopped", "PM2 stop failed");
            }
            break;

          default:
            run(cb => pm2[action](this.name, cb), `${action} done`, `PM2 ${action} failed`);
            break;
        }
      })();
    });
  }

  async #getTenantList(){
    const rows = [];
    for (const app of tenant.tenants()) {
      if (app) {
        rows.push({
          name: app.name,
          port: app.env.PORT,
          domain: app.env.DOMAIN,
          status: await tenantStatus(app),
          node_env: app.env.NODE_ENV
        });
      }
    }

    return rows;
  }

  async getList({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
    q ??= {};

    const pagination = {
      page: loopar.session.get(this.__ENTITY__.name + "_page") || 1,
      pageSize: 10,
      totalPages: 1,
      totalRecords: 0,
      sortBy: "id",
      sortOrder: "asc",
      __ENTITY__: this.__ENTITY__.name
    };

    const listFields = this.getFieldListNames();
    const allRows = await this.#getTenantList([]);
    
    const nameFilter = (this.name || "").toLowerCase();
    const filtered = allRows.filter(row =>
      (row.name || "").toLowerCase().includes(nameFilter)
    );

    pagination.totalRecords = filtered.length;
    pagination.totalPages = Math.max(1, Math.ceil(filtered.length / pagination.pageSize));

    if (pagination.page > pagination.totalPages) {
      pagination.page = 1;
      loopar.session.set(this.__ENTITY__.name + "_page", 1);
    }

    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const rows = filtered.slice(startIndex, startIndex + pagination.pageSize);

    const selfPagination = JSON.parse(JSON.stringify(pagination));

    return Object.assign((rowsOnly ? {} : await this.__meta__()), {
      labels: this.getFieldListLabels(),
      fields: listFields,
      rows: rows.sort((a, b) => (b.name === "dev") - (a.name === "dev")),
      pagination: selfPagination,
      q
    });
  }
}