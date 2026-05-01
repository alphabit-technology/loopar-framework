
'use strict';

import {BaseDocument, loopar} from 'loopar';

export default class Profile extends BaseDocument {
  constructor(props){
      super(props);
  }

  async rawValues() {
    return await loopar.db.getDoc("User", loopar.auth.user(), [
      "name", "email", "disabled", "profile_picture", "first_name", "last_name", "phone", "user_type"
    ]);
  }

  async changePassword({ current_password, new_password, confirm_password }) {
    if (!current_password || !new_password || !confirm_password) {
      loopar.throw('All fields are required.');
    }

    if (new_password !== confirm_password) {
      loopar.throw('New password and confirmation do not match.');
    }

    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}/;
    if (!strongRegex.test(new_password)) {
      loopar.throw('Password must be at least 8 characters and include uppercase, lowercase, number and special character.');
    }

    const user = await loopar.getDocument('User', loopar.auth.user());

    if (!await loopar.verifyHash(current_password, user.password)) {
      loopar.throw('Current password is incorrect.');
    }

    user.password = new_password;
    user.confirm_password = confirm_password;
    await user.save();
  }

  async updateInfo(data) {
    const { password, confirm_password, ...safeData } = data;
  
    const user = await loopar.getDocument('User', loopar.auth.user(), safeData);
    user.password = this.protectedPassword;
    user.confirm_password = this.protectedPassword;
    await user.save();
  }
}