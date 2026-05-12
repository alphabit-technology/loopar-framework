'use strict';

import { PageController, loopar, BaseController, PermissionManager, Op } from 'loopar';

const getCommonActions = () => {
  return loopar.extractControllerMethods(BaseController).map(a => a.replace(/^(public)?action/i, ''))
}

async function onModel(model, data, assign) {
  if (assign) {
    if (await loopar.db.count(model, data) == 0) {
      await loopar.db.insertRow(model, { name: loopar.getUniqueKey(), ...data });
    }
  } else {
    await loopar.db.deleteWhere(model, data);
  }
}

async function getActions() {
  const base = await PermissionManager.getAllActions();
  const models = await loopar.db.getAll("Module", ["name", "app_name"]);

  return [
    ...base,
    ...models.map(m => ({ document: `Module.${m.name}`, app: m.app_name, action: "view" }))
  ];
}

export default class RolePermissionManagerController extends PageController {
  static freeActions=["getOwnPermissions"]
  async actionView() {
    const { role="core", user, preloaded } = this.query;

    if (!user) {
      let assigned = await loopar.db.getAll(
        'Permission',
        ['document', 'action'],
        { relation: 'Role', relation_name: role }
      );
      assigned = assigned.map(r => `${r.document}:${r.action}`);

      if (preloaded) return assigned;

      const roles = await loopar.db.getAll("Role", ['name'], { disabled: 0 });
      const view = await loopar.getDocument("Role Permission Manager");
      /* view.roles = roles;
      view.role = role;
      view.permissions = assigned; */
      return this.render(view, {roles, role, permissions: assigned});
    }

    const userRoles = await loopar.db.getAll('User Role', ['role'], { user });

    const rolePerms = userRoles.length > 0
      ? await loopar.db.getAll(
          'Permission',
          ['document', 'action'],
          { relation: 'Role', relation_name: { [Op.in]: userRoles.map(r => r.role) } }
        )
      : [];

    const userPerms = await loopar.db.getAll(
      'Permission',
      ['document', 'action'],
      { 
        relation: 'User', 
        relation_name: user, 
        deny: { [Op.or]: [null, 0] }
      }
    );

    const userDenies = await loopar.db.getAll(
      'Permission',
      ['document', 'action'],
      { relation: 'User', relation_name: user, deny: 1 }
    );

    const deniedSet = new Set(userDenies.map(r => `${r.document}:${r.action}`));
    const deniedDocs = new Set(
      userDenies
        .filter(r => r.action === '*')
        .map(r => r.document)
    );
    const denyAll = deniedSet.has('*:*');
    const directSet = new Set(userPerms.map(r => `${r.document}:${r.action}`));
    const fromRoles = rolePerms
      .map(r => `${r.document}:${r.action}`)
      .filter(key => {
        if (denyAll) return false;
        const [doc] = key.split(':');
        return !deniedSet.has(key) && !deniedDocs.has(doc);
      });
    const fromUser = [...directSet].filter(key => {
      if (denyAll) return false;
      const [doc] = key.split(':');
      return !deniedSet.has(key) && !deniedDocs.has(doc);
    });

    const assigned = [...new Set([...fromRoles, ...fromUser])];

    if (preloaded) return assigned;

    const roles = await loopar.db.getAll("Role", ['name'], { disabled: 0 });
    const view = await loopar.getDocument("Role Permission Manager");
    /* view.roles = roles;
    view.role = role;
    view.user = user;
    view.permissions = assigned; */
    return this.render(view, {roles, role, user, permissions: assigned});
  }

  async actionGetEntities(){
    const {mode} = this.query;
    return await loopar.db.getAll(mode, ["name"]);
  }

  async actionGetAllPerms() {
    const allPerms = await getActions();

    const grouped = {};
    for (const { document, action, app } of allPerms) {
      const appKey = app || 'Core';
      if (!grouped[appKey]) grouped[appKey] = {};
      if (!grouped[appKey][document]) grouped[appKey][document] = [];
      grouped[appKey][document].push(action);
    }

    return { grouped, commonActions: getCommonActions() };
  }

  async actionToggle() {
    const { mode = "Role", entity, document, action, assign } = this.body || {};

    if (!entity || !document || !action) {
      loopar.throw(`${mode}, document and action are required`);
    }
  
    const whereBase = {
      relation: mode,
      relation_name: entity,
      document,
      action
    };
  
    let roles = [];
    if (mode === "User") {
      roles = (await loopar.db.getAll('User Role', ['role'], { user: entity }))
        .map(r => r.role);
    }
  
    const comesFromRole = mode === "User" && roles.length
      ? await loopar.db.count('Permission', {
          relation: 'Role',
          relation_name: { [Op.in]: roles },
          document,
          action
        })
      : false;
  
    const hasDirectAllow = await loopar.db.count('Permission', {
      ...whereBase,
      deny: 0
    });

    const hasDeny = await loopar.db.count('Permission', {
      ...whereBase,
      deny: 1
    });
  
    const hasWildcard = await loopar.db.count('Permission', {
      relation: mode,
      relation_name: entity,
      document,
      action: '*'
    });
  
    if (assign) {
      if (hasDeny) {
        await loopar.db.deleteWhere('Permission', {
          ...whereBase,
          deny: 1
        });
      }
  
      if (!comesFromRole && !hasDirectAllow) {
        await onModel("Permission", {
          ...whereBase,
          deny: 0
        }, true);
      }
    } else {
      if (hasWildcard) {
        await loopar.db.deleteWhere('Permission', {
          relation: mode,
          relation_name: entity,
          document,
          action: '*'
        });
  
        const allActions = await getActions();
  
        for (const { action: a } of allActions) {
          if (a !== action) {
            await onModel("Permission", {
              relation: mode,
              relation_name: entity,
              document,
              action: a,
              deny: 0
            }, true);
          }
        }
      }
  
      if (hasDirectAllow) {
        await loopar.db.deleteWhere('Permission', whereBase);
      }
  
      else if (comesFromRole && mode === "User") {
        if (!hasDeny) {
          await onModel("Permission", {
            ...whereBase,
            deny: 1
          }, true);
        }
      }
  
      else {
        await loopar.db.deleteWhere('Permission', whereBase);
      }
    }
  
    if (mode === "Role") {
      await this._invalidateRoleUsers(entity);
    }
  
    return this.success(
      `${action} was ${assign ? 'assigned' : 'removed'} to ${
        mode === 'Role' ? 'Role.' + entity : 'User.' + entity
      }`,
      { notify: { type: assign ? 'success' : 'warning' } }
    );
  }

  async actionToggleAll() {
    const { mode = "Role", entity, document, assign } = this.body || {};
    if (!entity || !document) return this.error(`${mode} and document are required`);
  
    if (mode === "Role") {
      await loopar.db.deleteWhere('Permission', { relation: mode, relation_name: entity, document });
      if (assign) {
        await loopar.db.insertRow('Permission', {
          name: loopar.getUniqueKey(),
          relation: mode, relation_name: entity, document, action: '*', deny: 0
        });
      }
      await this._invalidateRoleUsers(entity);
    } else {
      await loopar.db.deleteWhere('Permission', { relation: mode, relation_name: entity, document });
  
      if (assign) {
        await loopar.db.insertRow('Permission', {
          name: loopar.getUniqueKey(),
          relation: mode, relation_name: entity, document, action: '*', deny: 0
        });
      } else {
        const roles = (await loopar.db.getAll('User Role', ['role'], { user: entity })).map(r => r.role);
        const comesFromRole = roles.length
          ? await loopar.db.count('Permission', {
              relation: 'Role',
              relation_name: { [Op.in]: roles },
              document
            })
          : 0;

        if (comesFromRole) {
          await loopar.db.insertRow('Permission', {
            name: loopar.getUniqueKey(),
            relation: mode, relation_name: entity, document, action: '*', deny: 1
          });
        }
      }
    }
  
    return this.success(`All permissions ${assign ? 'assigned' : 'removed'}`, {
      notify: { type: assign ? 'success' : 'warning' }
    });
  }
  
  async actionToggleCol() {
    const { mode = "Role", entity, app, action, assign } = this.body || {};
    if (!entity || !action) loopar.throw('entity and action are required');
  
    let perms = await getActions();
    perms = app
      ? perms.filter(p => p.app === app && p.action === action)
      : perms.filter(p => p.action === action);
  
    for (const { document } of perms) {
      if (mode === "Role") {
        if (assign) {
          const hasWildcard = await loopar.db.count('Permission', {
            relation: mode, relation_name: entity, document, action: '*'
          });
          if (!hasWildcard) {
            await onModel("Permission", { relation: mode, relation_name: entity, document, action, deny: 0 }, true);
          }
        } else {
          await onModel("Permission", { relation: mode, relation_name: entity, document, action }, false);
        }
      } else {
        await loopar.db.deleteWhere('Permission', {
          relation: mode, relation_name: entity, document, action
        });
  
        if (assign) {
          await onModel("Permission", { relation: mode, relation_name: entity, document, action, deny: 0 }, true);
        } else {
          const roles = (await loopar.db.getAll('User Role', ['role'], { user: entity })).map(r => r.role);
          const comesFromRole = roles.length
            ? await loopar.db.count('Permission', {
                relation: 'Role',
                relation_name: { [Op.in]: roles },
                document,
                action
              })
            : 0;
  
          if (comesFromRole) {
            await onModel("Permission", { relation: mode, relation_name: entity, document, action, deny: 1 }, true);
          }
        }
      }
    }
  
    if (mode === "Role") await this._invalidateRoleUsers(entity);
    return this.success(
      `${action} was ${assign ? 'assigned to' : 'removed from'} all Documents`,
      { notify: { type: assign ? 'success' : 'warning' } }
    );
  }

  async actionGetUserRoles() {
    const { user } = this.query;
    return await loopar.db.getAll("User Role", ["role"], { user });
  }

  async actionToggleUserRole() {
    const { user, role, assign } = this.body || {};
    if (!user || !role) loopar.throw('user and role are required');

    await onModel("User Role", { user, role }, assign);
    PermissionManager.invalidate(user);

    return this.success(
      `Role ${role} ${assign ? 'assigned to' : 'removed from'} ${user}`,
      { notify: { type: assign ? 'success' : 'warning' } }
    );
  }

  async _invalidateRoleUsers(role) {
    const users = await loopar.db.getAll('User Role', ['user'], { role });
    for (const { user } of users) {
      PermissionManager.invalidate(user);
    }
  }

  async actionGetUsers() {
    return await loopar.db.getAll("User", ["name"]);
  }

  async actionGetResolvedPermissions() {
    const { role = "core", user } = this.query ?? {};

    if (!user) {
      const rolePerms = await loopar.db.getAll(
        'Permission',
        ['document', 'action'],
        { relation: 'Role', relation_name: role }
      );
      const assigned = rolePerms.map(r => `${r.document}:${r.action}`);
      return { assigned, inherited: [], denied: [] };
    }

    const userRoles = await loopar.db.getAll('User Role', ['role'], { user });
    const rolePerms = userRoles.length > 0
      ? await loopar.db.getAll(
          'Permission',
          ['document', 'action'],
          { relation: 'Role', relation_name: { [Op.in]: userRoles.map(r => r.role) } }
        )
      : [];

    const userPerms = await loopar.db.getAll(
      'Permission',
      ['document', 'action'],
      {
        relation: 'User',
        relation_name: user,
        deny: { [Op.or]: [null, 0] }
      }
    );

    const userDenies = await loopar.db.getAll(
      'Permission',
      ['document', 'action'],
      { relation: 'User', relation_name: user, deny: 1 }
    );

    const deniedSet = new Set(userDenies.map(r => `${r.document}:${r.action}`));
    const deniedDocs = new Set(
      userDenies
        .filter(r => r.action === '*')
        .map(r => r.document)
    );
    const denyAll = deniedSet.has('*:*');
    const inheritedSet = new Set(
      rolePerms
        .map(r => `${r.document}:${r.action}`)
        .filter(key => {
          if (denyAll) return false;
          const [doc] = key.split(':');
          return !deniedSet.has(key) && !deniedDocs.has(doc);
        })
    );
    const directSet = new Set(
      userPerms
        .map(r => `${r.document}:${r.action}`)
        .filter(key => {
          if (denyAll) return false;
          const [doc] = key.split(':');
          return !deniedSet.has(key) && !deniedDocs.has(doc);
        })
    );
    const assigned = [...new Set([...inheritedSet, ...directSet])];

    return {
      assigned,
      inherited: [...inheritedSet],
      denied: [...deniedSet],
    };
  }

  async actionGetOwnPermissions(){
    return PermissionManager.getPermissions(loopar.auth.user())
  }
}