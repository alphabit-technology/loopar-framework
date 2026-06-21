'use strict'

import { BaseDocument, loopar } from "loopar";

export default class Login extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async login() {
    const user = await loopar.auth.getUser(this.user_name);
  
    const storedHash = user?.password ?? await loopar.hash('dummy');
    const isValidPassword = await loopar.verifyHash(this.password, storedHash);
  
    if (user && isValidPassword && !(user.disabled && user.name !== 'Administrator') &&
      (this.user_name === user.name || this.user_name === user.email)
    ) {
      loopar.auth.login(user);
    } else {
      loopar.auth.killSession();
      loopar.throw({ code: 401, trow: 'Login Error', message: 'Invalid user or password' });
    }
  }

  async logout() {
    loopar.auth.killSession();
  }
}