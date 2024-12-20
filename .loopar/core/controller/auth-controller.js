import { loopar } from "loopar";

export default class AuthController {
  loginActions = ['login', 'register', 'recovery_user', 'recovery_password'];

  constructor(options) {
    Object.assign(this, options);
  }

  __execute() {
    const [req, res] = [this.req, this.res];
    const action = this.action;
    const data = this.data;

    if (this.loginActions.includes(action)) {
      this.__login(action, data);
    } else {
      this.__logout();
    }
  }

  isAuthenticated() {
    return new Promise(async resolve => {
      const executeAction = (method, message, url) => {
        if (method === AJAX) {
          return loopar.throw(message);
        } else {
          //return this.res.redirect(url);
        }
      }

      if (this.req.session.user) { /** User is logged */
        //const user = {name: "Administrator", "email": "test"}//loopar.get_user(this.req.session.user.name);
        const user = loopar.getUser(this.req.session.user.name);

        if (user && user.name !== 'Administrator' && user.disabled) {
          executeAction(this.req.method, 'Not permitted', '/auth/login');
          return resolve(false);
        }

        if (this.isLoginAction) {
          executeAction(this.method, 'You are already logged in, refresh this page', '/desk/desk/view');
          return resolve(false);
        } else if (this.isEnableAction) {
          return resolve(true);
        } else {
          executeAction(this.method, 'Action not valid in Desk App', '/desk/desk/view');
          return resolve(false);
        }
      } else if (this.isLoginAction && (this.isFreeAction || this.isEnableAction)) {
        return resolve(true);
      } else if (this.free_access && this.workspace !== 'desk') {
        return resolve(true);
      }/* else if(this.isFreeAction) {
            resolve(true);
         }*/else {
        executeAction(this.method, 'Your session has ended, please log in again.', '/auth/login');
        return resolve(false);
      }
    });
  }

  get isFreeAction() {
    return !this.freeActions || this.freeActions.includes(this.action);
  }

  get isLoginAction() {
    return (this.loginActions || []).includes(this.action);
  }

  get isEnableAction() {
    return !this.actionsEnabled || this.actionsEnabled.includes(this.action);
  }

  isAuthorized() {
    return new Promise(resolve => {
      resolve(true);
    });
  }

  beforeAction() {
    return Promise.all([this.isAuthenticated(), this.isAuthorized()]);
  }
}