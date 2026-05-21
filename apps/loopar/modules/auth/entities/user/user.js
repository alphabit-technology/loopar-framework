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
    const regex = new RegExp("^[a-zA-Z ]+$");

    const excludeSelf = this.id ? { id: { [Op.ne]: this.id } } : {};
    
    if (!regex.test(this.name)) {
      loopar.throw('Your name must be at least 3 characters long');
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