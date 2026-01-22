import { loopar } from "loopar";

export default class AuthController {
  loginActions = ['login', 'register', 'recovery_user', 'recovery_password'];

  constructor(options) {
    Object.assign(this, options);
  }

  __execute() {
    const action = this.action;
    const data = this.data;

    if (this.loginActions.includes(action)) {
      this.__login(action, data);
    } else {
      this.__logout();
    }
  }

  async isAuthenticated() {
    const action = this.action;
    const workspace = this.req.__WORKSPACE_NAME__;
  
    if (this.isPublicAction) return true;
  
    const resolve = (message, url) => {
      return loopar.throw(message, this.method != AJAX && url || "/auth/login");
    }
  
    if (this.actionsEnabled && !this.actionsEnabled.includes(action)) {
      return resolve('Not permitted');
    }
  
    if (workspace == "web") return true;
    if (workspace == "loopar") return true;
  
    const user = await loopar.auth.award();
  
    if (user) {
      if (workspace == "auth") {
        if (action == "logout") return true;
        return resolve('You are already logged in, refresh this page', "/desk/Desk/view");
      }
  
      if (user.name !== 'Administrator' && user.disabled) {
        resolve('Not permitted');
      }
  
      return true;
    } else {
      if (workspace == "desk") {
        return resolve('You must be logged in to access this page', "/auth/login");
      }
      
      if (workspace == "auth" && this.isLoginAction) return true;
  
      resolve('You must be logged in to access this page');
    }
  }

  get isLoginAction() {
    return (this.loginActions || []).includes(this.action);
  }

  get isEnableAction() {
    return this.actionsEnabled ? this.actionsEnabled.includes(this.action) : false;
  }

  isAuthorized() {
    return new Promise(resolve => {
      resolve(true);
    });
  }

  async beforeAction() {
    return(await this.isAuthenticated() && await this.isAuthorized());
  }
}