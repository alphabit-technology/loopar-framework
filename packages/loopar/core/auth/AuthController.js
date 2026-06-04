import { loopar, PermissionManager } from "loopar";
import { validateCsrfToken } from './csrf.js';

export default class AuthController {
  async validateCsrf() {
    if (this.method === 'GET') return true;

    if (this.#isPublicAction(this.req.__WORKSPACE_NAME__)) return true;

    const workspace = this.req.__WORKSPACE_NAME__;
    if (workspace !== 'desk' && workspace !== 'api') return true;

    if (!validateCsrfToken(this.req)) {
      loopar.throw('Invalid CSRF token', '/auth/login');
    }

    return true;
  }

  #isPublicAction(workspace){
    if(workspace == "web") return true;
    const method = this[`publicAction${loopar.utils.Capitalize(this.action)}`];
    if(method && typeof method == "function") return true;

    return false;
  }

  #document = null;
  #action = null;
  #name = null;
  #query = {}

  constructor(props) {
    Object.assign(this, props);
  }

  set document(document) {this.#document = document}
  get document() {return this.#document}
  set query(query){this.#query = query}
  get query(){return this.#query || {}}
  set action(action){this.#action = action}
  get action(){return this.#action};
  set name(name){this.#name = name};
  get name(){ return this.#name}

  __execute() {
    const action = this.action;
    const data = this.data;

    if (this.publicActions.includes(action)) {
      this.__login(action, data);
    } else {
      this.__logout();
    }
  }

  async isAuthorized(user) {
    if (user.name === 'Administrator') return true;
    const workspace = this.req.__WORKSPACE_NAME__;

    if (this.#isPublicAction(workspace)) return true;

    if ((this.freeActions || []).includes(this.action)) return true;
  
    let allowed = await PermissionManager.can(
      this.document,
      this.action,
      user.name,
    );

    if(this.document == "Module"){
      allowed = await PermissionManager.can(
        `Module:${this.name}`,
        "view",
        user.name,
      ) || await PermissionManager.can(
        "Module",
        this.action,
        user.name,
      )
    }
  
    if (!allowed) {
      loopar.throw(
        'You do not have permission to perform this action'
      );
    }
  
    return allowed;
  }

  async #award() {
    const action = this.action;
    const workspace = this.req.__WORKSPACE_NAME__;

    const isAjax = this.method === 'POST' || workspace === 'api';
    const resolve = (message, url) => loopar.throw(
      message,
      isAjax ? null : (url || '/auth/login')
    );

    if (workspace === 'web' || workspace === 'loopar') return true;

    // On the auth FORM pages (login/register/recovery), an already-logged-in
    // user should be sent to where they belong instead of seeing the form
    // again. This must run BEFORE the public-action short-circuit below, since
    // `login` is itself a public action. Restricted to GET page loads of the
    // form actions so it never interferes with the ajax helpers (me,
    // oauthProviders) or the OAuth dance (oauth, oauthCallback) on this workspace.
    const AUTH_FORM_ACTIONS = ['login', 'register', 'recoveryuser', 'recoverypassword', 'recoverypasswordrequest'];
    if (
      workspace === 'auth' &&
      this.method === 'GET' &&
      AUTH_FORM_ACTIONS.includes(String(action).toLowerCase())
    ) {
      const current = await loopar.auth.award();
      if (current?.name) {
        const webLanding = process.env.WEB_LANDING || '/';
        return resolve('You are already logged in', current.user_type === 'Web' ? webLanding : '/desk');
      }
    }

    if (this.#isPublicAction(workspace)) return true;

    const user = await loopar.auth.award();

    if (user) {
      const webLanding = process.env.WEB_LANDING || '/';

      if (workspace === 'auth' && action !== 'logout') {
        // Already logged in → bounce to where this user belongs.
        const dest = user.user_type === 'Web' ? webLanding : '/desk/Desk/view';
        return resolve('You are already logged in, refresh this page', dest);
      }

      if (user.name !== 'Administrator' && user.disabled) {
        return resolve('Not permitted');
      }

      // Web users belong to the website only — no desk access, even if they
      // navigate to /desk directly.
      if (workspace === 'desk' && user.user_type === 'Web') {
        return resolve('This account does not have desk access', webLanding);
      }

      return await this.isAuthorized(user);
    }

    if (workspace === 'auth') return true;
    if (workspace === 'desk') {
      return resolve('You must be logged in to access this page', '/auth/login');
    }

    return resolve('You must be logged in to access this page');
  }

  async beforeAction() {
    return await this.#award() && await this.validateCsrf();
  }
}