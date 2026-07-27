'use strict';

import { Op } from "db-env";
import { loopar } from "loopar";
import { ActionScanner } from "./ActionScanner.js";

/**
 * Process-wide singleton, but the CORE model runs one process for every tenant,
 * so all state MUST be namespaced per tenant. Previously #store/#deniedStore
 * were keyed by username alone and #publicActions was a single Set: the same
 * username in two tenants collided (last boot() won) and one tenant's public
 * actions applied to all — a cross-tenant authorization leak. Now every
 * container is nested under the request tenant (loopar.requestTenantId), the
 * same pattern cacheManager already uses for its keys.
 *
 * The ORM hooks (registered via the `loopar` proxy) resolve to the request's
 * tenant at fire time, and #reload/#emitUpdate are tenant-scoped, so wiring
 * them per boot stays correct.
 */
class PermissionManagerClass {
  // tenant -> Map(username -> Set(permKey))
  #storesByTenant = new Map();
  // tenant -> Map(username -> Set(permKey))
  #deniedByTenant = new Map();
  // tenant -> Set(permKey)
  #publicByTenant = new Map();
  // tenant -> string[]
  #allActionsByTenant = new Map();

  /** Tenant namespace for the current request (falls back to core outside one). */
  #tenant() {
    return loopar.requestTenantId ?? '__core__';
  }

  #store() {
    const t = this.#tenant();
    let m = this.#storesByTenant.get(t);
    if (!m) { m = new Map(); this.#storesByTenant.set(t, m); }
    return m;
  }

  #denied() {
    const t = this.#tenant();
    let m = this.#deniedByTenant.get(t);
    if (!m) { m = new Map(); this.#deniedByTenant.set(t, m); }
    return m;
  }

  #public() {
    const t = this.#tenant();
    let s = this.#publicByTenant.get(t);
    if (!s) { s = new Set(); this.#publicByTenant.set(t, s); }
    return s;
  }

  #buildKey(document, action) {
    return `${document.toLowerCase().replaceAll(" ", "")}:${action.toLowerCase()}`;
  }

  #registerHooks() {
    loopar.hook("User Role", "afterSave", async ({doc}) => {
      await this.#reload(doc.user);
      this.#emitUpdate(doc.user);
    });

    loopar.hook("User Role", "afterDelete", async ({doc}) => {
      this.#store().delete(doc.user);
      this.#denied().delete(doc.user);
      this.#emitUpdate(doc.user);
    });

    loopar.hook("Permission", "afterSave", async ({doc}) => {
      if (doc.relation === 'Role') {
        await this.#reloadRole(doc.relation_name);
      } else {
        await this.#reload(doc.relation_name);
        this.#emitUpdate(doc.relation_name);
      }
    });

    loopar.hook("Permission", "afterDelete", async ({doc}) => {
      if (doc.relation === 'Role') {
        await this.#reloadRole(doc.relation_name);
      } else {
        await this.#reload(doc.relation_name);
        this.#emitUpdate(doc.relation_name);
      }
    });

    loopar.hook("Module", "afterSave", async () => { this.#allActionsByTenant.delete(this.#tenant()); });
    loopar.hook("Module", "afterDelete", async () => { this.#allActionsByTenant.delete(this.#tenant()); });
  }

  can(document, action, username) {
    username = username ?? loopar.auth.user() ?? 'Guest';
    if (username === 'Administrator') return true;

    const key = this.#buildKey(document, action);

    if (this.#public().has(key)) return true;

    const denied = this.#denied().get(username);
    if (denied?.has(key)) return false;

    const set = this.#store().get(username);
    if (!set) return false;

    return (
      set.has('*:*') ||
      set.has(this.#buildKey(document, '*')) ||
      set.has(this.#buildKey('*', action)) ||
      set.has(key)
    );
  }

  invalidate(username) {
    if (username) {
      this.#store().delete(username);
      this.#denied().delete(username);
    } else {
      this.#store().clear();
      this.#denied().clear();
    }
  }

  async #reload(username) {
    if (username === 'Administrator') return;

    const userRoles = await loopar.db.getAll('User Role', ['role'], { user: username });
    const roleNames = userRoles.map(r => r.role);

    const rolePerms = roleNames.length > 0
      ? await loopar.db.getAll(
          'Permission',
          ['document', 'action'],
          { relation: 'Role', relation_name: { [Op.in]: roleNames } }
        )
      : [];

    const userPerms = await loopar.db.getAll(
      'Permission',
      ['document', 'action'],
      { relation: 'User', relation_name: username, deny: { [Op.ne]: 1 } }
    );

    const userDenies = await loopar.db.getAll(
      'Permission',
      ['document', 'action'],
      { relation: 'User', relation_name: username, deny: 1 }
    );

    const deniedSet = new Set(
      userDenies.map(r => this.#buildKey(r.document, r.action))
    );

    const merged = new Set();

    for (const r of [...rolePerms, ...userPerms]) {
      const key = this.#buildKey(r.document, r.action);
      if (!deniedSet.has(key)) merged.add(key);
    }

    this.#store().set(username, merged);
    this.#denied().set(username, deniedSet);
  }

  async #reloadRole(roleName) {
    const users = await loopar.db.getAll('User Role', ['user'], { role: roleName });
    await Promise.all(users.map(async ({ user }) => {
      await this.#reload(user);
      this.#emitUpdate(user);
    }));
  }

  #emitUpdate(username) {
    loopar.emit(`permissionsChanged`);
  }

  async boot() {
    this.#registerHooks();
    await this.loadPublicActions();
    await this.refreshAllActions();

    const users = await loopar.db.getAll('User', ['name'], { disabled: 0 });
    await Promise.all(users.map(({ name }) => this.#reload(name)));
  }

  async loadPublicActions() {
    const raw = await ActionScanner.getPublicActions();
    this.#publicByTenant.set(this.#tenant(), new Set(
      raw.map(({ document, action }) => this.#buildKey(document, action))
    ));
  }

  async refreshAllActions() {
    this.#allActionsByTenant.set(this.#tenant(), await ActionScanner.getAllActions());
  }

  async getAllActions() {
    const t = this.#tenant();
    if (!this.#allActionsByTenant.get(t)?.length) await this.refreshAllActions();
    return [...(this.#allActionsByTenant.get(t) ?? [])];
  }

  getPermissions(username) {
    username = username ?? loopar.auth.user() ?? 'Guest';
    return {
      public:  [...this.#public()],
      private: username === 'Administrator'
        ? null
        : [...(this.#store().get(username) ?? [])],
      denied: username === 'Administrator'
        ? []
        : [...(this.#denied().get(username) ?? [])],
    };
  }
}

export const PermissionManager = new PermissionManagerClass();
