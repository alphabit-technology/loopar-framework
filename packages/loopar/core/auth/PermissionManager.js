'use strict';

import { Op } from "db-env";
import { loopar } from "loopar";
import { ActionScanner } from "./ActionScanner.js";

class PermissionManagerClass {
  #store = new Map();
  #publicActions = new Set();
  #deniedStore = new Map();
  #allActions = [];

  #buildKey(document, action) {
    return `${document.toLowerCase().replaceAll(" ", "")}:${action.toLowerCase()}`;
  }

  #registerHooks() {
    loopar.hook("User Role", "afterSave", async ({doc}) => {
      await this.#reload(doc.user);
      this.#emitUpdate(doc.user);
    });

    loopar.hook("User Role", "afterDelete", async ({doc}) => {
      this.#store.delete(doc.user);
      this.#deniedStore.delete(doc.user);
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

    loopar.hook("Module", "afterSave", async () => { this.#allActions = []; });
    loopar.hook("Module", "afterDelete", async () => { this.#allActions = []; });
  }

  can(document, action, username) {
    username = username ?? loopar.auth.user() ?? 'Guest';
    if (username === 'Administrator') return true;

    const key = this.#buildKey(document, action);

    if (this.#publicActions.has(key)) return true;

    const denied = this.#deniedStore.get(username);
    if (denied?.has(key)) return false;

    const set = this.#store.get(username);
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
      this.#store.delete(username);
      this.#deniedStore.delete(username);
    } else {
      this.#store.clear();
      this.#deniedStore.clear();
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

    this.#store.set(username, merged);
    this.#deniedStore.set(username, deniedSet);
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
    this.#publicActions = new Set(
      raw.map(({ document, action }) => this.#buildKey(document, action))
    );
  }

  async refreshAllActions() {
    this.#allActions = await ActionScanner.getAllActions();
  }

  async getAllActions() {
    if (!this.#allActions.length) await this.refreshAllActions();
    return [...this.#allActions];
  }

  getPermissions(username) {
    username = username ?? loopar.auth.user() ?? 'Guest';
    return {
      public:  [...this.#publicActions],
      private: username === 'Administrator'
        ? null
        : [...(this.#store.get(username) ?? [])],
      denied: username === 'Administrator'
        ? []
        : [...(this.#deniedStore.get(username) ?? [])],
    };
  }
}

export const PermissionManager = new PermissionManagerClass();