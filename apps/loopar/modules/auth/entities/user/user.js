'use strict'

import { BaseDocument, loopar, Op } from "loopar";

export default class User extends BaseDocument {
  constructor(props) {
    super(props);
  }

  validatePasswordStrong(password) {
    const strongRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    if (!strongRegex.test(password)) {
      loopar.throw('Password must be at least 8 characters and include uppercase, lowercase, number and special character.');
    }
  }

  async validateUserName() {
    // `name` is the document ID: either an email (web signup) or a plain
    // username (e.g. "Administrator"). The person's name lives in first_name/last_name.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const usernameRegex = /^[\p{L}\p{N}._-]{3,}$/u;
    const personNameRegex = /^[\p{L} '\-]+$/u;

    const excludeSelf = this.id ? { id: { [Op.ne]: this.id } } : {};

    const name = (this.name || '').trim();
    if (!emailRegex.test(name) && !usernameRegex.test(name)) {
      loopar.throw('User name must be a valid email or at least 3 characters (letters, numbers, ".", "_" or "-").');
    }

    for (const field of ['first_name', 'last_name']) {
      const value = (this[field] || '').trim();
      if (value && !personNameRegex.test(value)) {
        loopar.throw(`${field === 'first_name' ? 'First' : 'Last'} name may only contain letters, spaces, apostrophes and hyphens.`);
      }
    }

    if (!loopar.installing && this.__IS_NEW__ && this.name === 'Administrator') {
      loopar.throw('User name "Administrator" is not allowed');
    }

    if (await loopar.db.getValue('User', 'id', { name: this.name, ...excludeSelf })) {
      loopar.throw(`The name <strong>${this.name}</strong> is invalid`);
    }

    if (await loopar.db.getValue('User', 'id', { email: this.email, ...excludeSelf })) {
      loopar.throw(`The email <strong>${this.email}</strong> is invalid`);
    }
  }

  async validate() {
    if (this.disabled && this.name === 'Administrator') {
      loopar.throw('The "Administrator" user cannot be disabled.');
    }

    if (this.disabled && this.name == loopar.auth.authUser()?.name) {
      loopar.throw('You cannot disable your own account.');
    }

    await super.validate();
    await this.validateUserName();
  }

  async save() {
    const password = this.password;
    const confirmPassword = this.confirm_password;

    if (password !== confirmPassword) {
      loopar.throw('The password and confirmation password do not match.');
    }

    if (this.__IS_NEW__) {
      this.password = await loopar.hash(password);
      this.confirm_password = await loopar.hash(confirmPassword);
    } else {
      const user = await loopar.getDocument('User', this.name);

      if (password && password.length > 0 && password !== this.protectedPassword) {
        this.password = await loopar.hash(password);
        this.confirm_password = await loopar.hash(confirmPassword);
      } else {
        this.password = user.password;
        this.confirm_password = user.confirm_password;
      }
    }

    await super.save(arguments[0]);
  }

  async delete() {
    if (this.name === 'Administrator') {
      loopar.throw('The "Administrator" user cannot be deleted.');
      return;
    }

    await super.delete();
  }
}