'use strict';

import "loopar/bin/pm2-home.js";
import { BaseDocument, tenant } from 'loopar';
import { loopar } from 'loopar';
import fs from "fs";
import path from "pathe";
import CaddyManager from "loopar/bin/tenant/caddy-manager.js";
import {
  withPm2Bus,
  pm2Action,
  tenantStatus,
  provision as serviceProvision,
  destroy as serviceDestroy,
} from "loopar/bin/tenant/tenant-service.js";

/**
 * TenantManager entity — Desk UI / control-plane facade over
 * loopar/bin/tenant/tenant-service.js.
 *
 * All PM2/Caddy/provision orchestration lives in the service so the exact
 * same code path serves the UI, the CLI (bin/cli/) and the TUI
 * (bin/tui/). This class only adds the document layer: validation,
 * .env persistence through save(), and loopar-aware error reporting.
 */

const tenantsDir = path.join(process.cwd(), 'sites');

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

  async getStatus()  { return await tenantStatus(this.name); }
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

  #selfOpts() { return { selfTenantId: loopar.tenantId }; }

  async start() {
    await this.initInstance();
    return this;
  }

  async stop() {
    return await withPm2Bus(() => pm2Action(this.name, "stop", this.#selfOpts()));
  }

  async restart() {
    const restarted = await withPm2Bus(() => pm2Action(this.name, "restart", this.#selfOpts()));
    if (restarted && this.domain) {
      await this.removeDomain(this.domain);
      await this.caddy.registerTenant(this.domain, this.port);
    }
    return restarted;
  }

  async reload() {
    return await withPm2Bus(() => pm2Action(this.name, "reload", this.#selfOpts()));
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
      let registered = false;
      try {
        await this.caddy.ensureReady();
        registered = await this.caddy.registerTenant(this.domain, this.port);
      } catch (err) {
        return loopar.throw(err.message || "Caddy configuration failed");
      }
      // Thrown OUTSIDE the try so loopar.throw's error isn't re-caught and
      // re-wrapped by our own catch (it would lose its code on the way out).
      if (!registered) return loopar.throw("Could not register tenant in Caddy.");
    }

    await withPm2Bus(() => pm2Action(this.name, "start", this.#selfOpts()));

    console.log(`\n✅ ${this.name} ready`);
    console.log(`   ${hasDomain ? `http://${this.domain}` : `http://localhost:${this.port}`}\n`);

    return true;
  }

  /**
   * End-to-end tenant bring-up for cloud / SaaS callers (the control plane's
   * provisioning flow). See tenant-service.provision() for the mechanics.
   *
   * Unlike `initInstance()` (which goes through `save()` and is meant for the
   * desk UI), `provision()` writes the .env directly so callers can stash
   * extra env keys (CUSTOMER_EMAIL, CLOUD_VERIFIER_*) in a single pass
   * without tripping the desk-side `__IS_NEW__` uniqueness guard.
   */
  async provision(opts = {}) {
    await this.validate();
    return await serviceProvision(
      {
        name:   this.name,
        id:     this.id,
        port:   this.port,
        domain: this.domain,
        raw:    await this.rawValues(),
      },
      {
        ...opts,
        // Mark as existing at the same point the pre-refactor code did (right
        // after the .env hits disk), so a subsequent save() doesn't re-run
        // the uniqueness guard against the very directory we just wrote.
        onEnvWritten: () => { this.__IS_NEW__ = false; },
      }
    );
  }

  /**
   * Teardown counterpart to `provision()`. Idempotent — safe to call from
   * cleanup crons without pre-checking. See tenant-service.destroy().
   *
   * @param {object}  opts
   * @param {boolean} opts.removePath  When false, the on-disk directory is
   *                                   kept (operator can inspect / revive).
   */
  async destroy({ removePath = true } = {}) {
    return await serviceDestroy(this.name, {
      domain: this.domain,
      removePath,
      ...this.#selfOpts(),
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
          status: await tenantStatus(app.name),
          node_env: app.env.NODE_ENV
        });
      }
    }

    return rows;
  }

  async getList({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
    q ??= {};

    const pagination = {
      page: loopar.session.get(`${this.__ENTITY__.name}page`) || 1,
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
      loopar.session.set(this.__ENTITY__.name + "page", 1);
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
