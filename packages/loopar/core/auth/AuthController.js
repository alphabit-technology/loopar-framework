import { loopar, PermissionManager } from "loopar";
import { validateCsrfToken } from './csrf.js';
import { workspaceCapabilities, workspaceRequiresAuth, getWorkspaceName } from "../global/router-utils.js";

export default class AuthController {
  async validateCsrf() {
    if (this.method === 'GET') return true;

    if (this.#isPublicAction(this.req.__WORKSPACE_NAME__)) return true;

    if (this.#isRpc) {
      if (!validateCsrfToken(this.req)) {
        loopar.throw('Invalid CSRF token', '/auth/login');
      }
      return true;
    }

    const workspace = this.req.__WORKSPACE_NAME__;
    if (!workspaceCapabilities(workspace).enforceCsrf) return true;

    if (!validateCsrfToken(this.req)) {
      loopar.throw('Invalid CSRF token', '/auth/login');
    }

    return true;
  }

  /** RPC mode: workspace-less /{Document}/{action} routed by middleware. */
  get #isRpc() {
    return this.req?.__ROUTE_MODE__ === 'rpc';
  }

  #isPublicAction(workspace){
    if(workspace == "web" && !this.#isRpc) return true;
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

    const cap = workspaceCapabilities(workspace);

    const isAjax = this.method === 'POST' || workspace === 'api' || this.#isRpc;
    const resolve = (message, url) => loopar.throw(
      message,
      isAjax ? null : (url || '/auth/login')
    );

    if (this.#isRpc) {
      if (this.#isPublicAction(workspace)) return true;

      const user = await loopar.auth.award();
      if (!user) return resolve('You must be logged in to perform this action');

      if (user.name !== 'Administrator' && user.disabled) {
        return resolve('Not permitted');
      }

      if (cap.blockWebUsers && user.user_type === 'Web') {
        return resolve('This account does not have desk access');
      }

      return await this.isAuthorized(user);
    }

    // Fully public surfaces (web, loopar): no auth gate at all (navigation).
    if (cap.public) return true;

    const AUTH_FORM_ACTIONS = ['login', 'register', 'recoveryuser', 'recoverypassword', 'recoverypasswordrequest'];
    if (
      cap.isAuth &&
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

      if (cap.isAuth && action !== 'logout') {
        const dest = user.user_type === 'Web' ? webLanding : '/desk/Desk/view';
        return resolve('You are already logged in, refresh this page', dest);
      }

      if (user.name !== 'Administrator' && user.disabled) {
        return resolve('Not permitted');
      }

      if (cap.blockWebUsers && user.user_type === 'Web') {
        return resolve('This account does not have desk access', webLanding);
      }

      return await this.isAuthorized(user);
    }

    if (cap.isAuth) return true;
    if (cap.requiresAuth) {
      let url = '/auth/login';
      if (!isAjax) {
        const back = this.req?.originalUrl || '';
        if (back && workspaceRequiresAuth(getWorkspaceName(back))) {
          url += `?redirect=${encodeURIComponent(back)}`;
        }
      }
      return resolve('You must be logged in to access this page', url);
    }

    return resolve('You must be logged in to access this page');
  }

  /**
   * Actions that don't change state and are therefore safe to run on a GET
   * (HTTP semantics: GET/HEAD must be safe / idempotent). Everything else —
   * `delete`, `bulkDelete`, and any custom mutator — must arrive over a
   * CSRF-validated request, i.e. POST (`loopar.call` is always POST).
   *
   * `update`/`create` are safe here because they self-branch: with no body
   * they only RENDER the form; their write path needs a POST body, which on
   * an authenticated workspace is CSRF-gated anyway.
   */
  static SAFE_ON_GET = new Set(['view', 'list', 'update', 'create', 'search']);

  /**
   * A GET (or HEAD) may only run a state-safe action. This closes the
   * CSRF-via-GET hole on BOTH channels at once: navigation (`/desk/...`) and
   * the RPC `/api/...` surface both reach `validateCsrf`, which exempts GET —
   * so without this guard a top-level `GET /desk/User/delete?name=X` (or
   * `GET /api/User/delete?name=X`) would delete using only the victim's
   * session cookie, no token required. Mutations must use POST.
   *
   * Explicit `publicAction<X>` methods opt out: the developer owns those
   * entry points, and GET-redirect flows like the OAuth callback need them.
   */
  #assertGetSafety() {
    const method = String(this.method || '').toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') return;

    const action = String(this.action || '').toLowerCase();
    if (AuthController.SAFE_ON_GET.has(action)) return;

    const publicMethod = this[`publicAction${loopar.utils.Capitalize(this.action)}`];
    if (typeof publicMethod === 'function') return;

    loopar.throw({
      code: 404,
      message: `Action "${this.action}" is not available over GET \u2014 mutations must use loopar.call (POST).`,
    });
  }

  async beforeAction() {
    this.#assertGetSafety();
    return await this.#award() && await this.validateCsrf();
  }
}