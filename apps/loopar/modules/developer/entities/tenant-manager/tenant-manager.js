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
    return await this.#pm2Action("stop");
  }

  async restart() {
    const restarted = await this.#pm2Action("restart");
    if (restarted && this.domain) {
      await this.removeDomain(this.domain);
      await this.caddy.registerTenant(this.domain, this.port);
    }
    return restarted;
  }

  async reload() {
    return await this.#pm2Action("reload");
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
    //this.node_env = "production";
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

    await this.#pm2Action("start");

    console.log(`\n✅ ${this.name} ready`);
    console.log(`   ${hasDomain ? `http://${this.domain}` : `http://localhost:${this.port}`}\n`);

    return true;
  }

  static SELF_ACTION_DELAY_MS = 400;

  async #pm2Action(action) {
    return new Promise(resolve => {
      const finish = (success, message, err = null) => {
        pm2.disconnect();
        if (err) { console.error(message, err); return resolve(false); }
        console.log(`${success ? '✅' : '❌'} ${this.name}: ${message}`);
        resolve(success);
      };

      pm2.connect(async err => {
        if (err) return finish(false, "PM2 connection error", err);

        let config = null;
        if (action === "start" || action === "restart") {
          config = await this.__data__();
          if (!config) return finish(false, "Tenant config not found");
          const NODE_ENV = config.env.NODE_ENV || "development";
          const isProduction = NODE_ENV === 'production';
          config.exec_mode = isProduction ? 'cluster' : 'fork';
          config.instances = 1;
        }

        const run = (fn, ok, fail) => fn(e => e ? finish(false, fail, e) : finish(true, ok));

        const isSelf = this.name === loopar.tenantId;

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
      });
    });
  }
}

const getTenant = async (name, isNew = false) => {
  const app = tenant.getTenantData(name);
  const doc = await loopar.newDocument("Tenant Manager", {
    id: app.name,
    port: app.env.PORT,
    domain: app.env.DOMAIN,
    node_env: app.env.NODE_ENV
  });
  doc.name = app.name;
  doc.__IS_NEW__ = isNew;
  return doc;
};

const tenantList = async () => {
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

  const model = await loopar.getList("Tenant Manager");
  model.rows  = rows.sort((a, b) => (b.name === "dev") - (a.name === "dev"));
  return model;
};

export { getTenant, tenantList };