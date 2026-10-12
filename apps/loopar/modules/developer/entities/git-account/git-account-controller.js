'use strict';

import { loopar, BaseController } from 'loopar';

/**
 * Git accounts are personal credentials: whatever their role (Administrator
 * included), a user lists, opens and edits only the accounts they created.
 * Using someone else's token would mean acting on GitHub as them.
 */
export default class GitAccountController extends BaseController {
  static freeActions = ['list', 'view', 'create', 'update', 'delete', 'bulkDelete'];

  constructor(props) {
    super(props);
  }

  async ownerFilters(user = loopar.auth.user()) {
    return await this.ownerCondition(user);
  }

  #targetNames() {
    if (this.name) return [this.name];
    let raw = this.body?.names ?? this.data?.names;
    if (loopar.utils.isJSON(raw)) raw = JSON.parse(raw);
    return Array.isArray(raw) ? raw : [];
  }

  async isAuthorized(user) {
    for (const name of this.#targetNames()) {
      if (await this.isOwner(name, user.name) === false) {
        loopar.throw({ code: 403, message: 'This git account belongs to another user.' });
      }
    }
    return true;
  }
}
