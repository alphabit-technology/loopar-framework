
'use strict';

import {loopar, BaseController} from 'loopar';
import {validatePasswordResetToken, generatePasswordResetToken, resetPassword} from "./recovery.js"
import {sendPasswordResetEmail} from "./recovery-email.js"

export default class AuthController extends BaseController {
  static publicActions = ['login', 'register', 'recoveryUser', 'recoveryPassword', 'login', 'logout'];
  static actionsEnabled = ['login', 'logout'];
  
  constructor(props){
    super(props);
  }

  async publicActionLogin() {
    return await this.#makeAction('Login', async (form) => {
      await form.login();
      return this.redirect('/desk/Desk/view', { hard: true });
    });
  }

  async publicActionLogout() {
    loopar.auth.logout();
    return this.redirect('/auth/login');
  }

  async publicActionRegister() {
    return await this.#makeAction('Register');
  }

  async publicActionRecoveryUser() {
    return await this.#makeAction('Reset User');
  }

  async forgotUsername() {
    const { email } = this.body;
    const { user } = await getUsernameByEmail(email);

    if (user) {
      await sendUsernameReminderEmail(user);
    }

    return this.success('Si el correo existe, recibirás tu nombre de usuario.');
  }

  async publicActionRecoveryPasswordRequest() {
    const self = this;
    return await this.#makeAction('Reset Password Request', async () => {
      const { email } = self.body;
  
      const { ok, user, rawToken } = await generatePasswordResetToken(email);
  
      if (user && rawToken) {
        await sendPasswordResetEmail(user, rawToken);
      }
  
      return `We sent a password reset link to ${email}.`;
    });
  }

  async publicActionRecoveryPassword() {
    return await this.#makeAction('Reset Password', async () => {
      const { token, new_password } = this.body;
  
      try {
        await resetPassword(token, new_password);
        return this.success('Password reset succesfull.');
      } catch (e) {
        return this.error(e.message); // 'link expired' | `Invalid Link '
      }
    });
  }

  async publicActionRecoveryUser() {
    return await this.#makeAction('Reset Password', async () => {
      const { email } = this.body;
  
      ///...
    });
  }

  async publicActionValidateResetToken() {
    const { token } = this.query;
    const { valid, reason } = await validatePasswordResetToken(token);

    if (!valid) {
      return { valid: false, reason }
    }

    return  {valid: true }
  }

  async #makeAction(form, fn) {
    this.client = "form";
    form = await loopar.newDocument(form, this.data);
    if (this.hasData()) {
      return await fn(form);
    } else {
      return await this.render(await form.__meta__());
    }
  }
}