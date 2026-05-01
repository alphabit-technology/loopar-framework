'use strict'

import { BaseController, loopar } from "loopar";

export default class UserController extends BaseController {
  static freeActions=["profile"]
  constructor(props) {
    super(props);
  }

  async actionUpdate() {
    this.context ??= 'form';
    const document = await loopar.getDocument("User", this.name, this.hasData() ? this.data : null);

    if (!this.hasData()) {
      document.password = document.protectedPassword;
      document.confirm_password = document.protectedPassword;
    }
    return await super.actionUpdate(document);
  }

  actionLogout() {
    loopar.session.destroy();
    this.redirect('/login/login');
  }

  async actionGetRoles(){
    return await loopar.db.getAll("Role", ["name"])
  }

  async actionGetUserRoles(){
    return await loopar.db.getAll("User Role", ["role"], {user: this.query.userId})
  }

  async publicActionProfile(){
    this.client = "form"
    const user = await loopar.newDocument("Profile")

    return await super.render(user)
  }
}