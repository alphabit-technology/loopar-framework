import HTTP from '@@tools/router/http';

export default class Router extends HTTP {
  constructor(){
    super();

    const buildSurface = (dispatcher) => ({
      call: (Document, action, options = {}) => dispatcher(Document, action, options),
      get: (Document, action, options = {}) => dispatcher(Document, action, { ...options, method: "GET" }),
      post: (Document, action, options = {}) => dispatcher(Document, action, { ...options, method: "POST" }),
      put: (Document, action, options = {}) => dispatcher(Document, action, { ...options, method: "PUT" }),
      patch: (Document, action, options = {}) => dispatcher(Document, action, { ...options, method: "PATCH" }),
      delete: (Document, action, options = {}) => dispatcher(Document, action, { ...options, method: "DELETE" }),
    });

    /**
     * Third-party API surface — always routes through `/api/{Doc}/{action}`.
     * Use for external integrations, webhooks, or actions that must reach
     * the `api` workspace regardless of where the user is browsing.
     */
    this.api = buildSurface((Doc, action, opts) => this.#apiCall(Doc, action, opts));

    /**
     * Internal RPC surface — routes through `/{currentWorkspace}/{Doc}/{action}`.
     */
    this.rpc = buildSurface((Doc, action, opts) => this.#rpcCall(Doc, action, opts));
  }

  /**
   * @param {string} Document - Document/entity name (controller key).
   * @param {string} action - Controller action name.
   * @param {Object|null} [params] - Sent as JSON body. Pass null for none.
   * @param {Object} [options] - { query, success, error, always, freeze }.
   * @returns {Promise} Resolves with the controller response.
   */
  call(Document, action, params = null, options = {}) {
    return this.rpc.post(Document, action, {
      ...options,
      ...(params !== null && params !== undefined ? { body: params } : {}),
    });
  }

  /**
   * Reads the workspace segment from the browser URL. Falls back to "web"
   * during SSR or before the SPA has mounted.
   */
  #currentWorkspace() {
    if (typeof window === "undefined") return "web";
    const segment = window.location.pathname.split("/")[1];
    return segment && segment.length ? segment : "web";
  }

  /**
   * Shared dispatcher used by both `#apiCall` and `#rpcCall`. Takes a
   * pre-built URL and forwards the rest of the options to `send()`. Handles
   * both callback and promise modes.
   */
  #dispatchCall(url, options = {}) {
    const {
      method = "POST",
      query = {},
      body,
      success,
      error,
      always,
      freeze,
    } = options;

    const sendArgs = {
      method,
      action: url,
      query,
      ...(body !== undefined ? { body } : {}),
      freeze: freeze !== false,
      success,
      error,
      always,
    };

    const hasCallback = !!(success || error || always);

    if (hasCallback) {
      return this.send(sendArgs);
    }

    return new Promise((resolve, reject) => {
      this.send({
        ...sendArgs,
        success: resolve,
        error: reject,
      });
    });
  }

  /**
   * Public-API call — always hits `/api/{Document}/{action}`.
   *
   * @param {string} Document
   * @param {string} action
   * @param {Object} [options] - { method, query, body, success, error, always, freeze }
   */
  #apiCall(Document, action, options = {}) {
    return this.#dispatchCall(`/api/${Document}/${action}`, options);
  }

  /**
   * Workspace-scoped RPC call — hits the current workspace's controller.
   *
   * URL shape follows the server's `RouteParsing.parseParams` contract:
   *
   *   - `web` / `auth`: `/{workspace}/{action}`   The workspace segment IS
   *     the routing prefix; the Document is implicit (Auth for auth, Home
   *     for web via setDefaultParams). Adding a Document segment would
   *     shift `action` out of the parser's window and produce a bogus
   *     "Action not found".
   *
   *   - Everything else (`desk`, `portal`, `loopar`, `api`, custom):
   *     `/{workspace}/{Document}/{action}` — the standard three-segment
   *     shape after the workspace prefix is stripped by parseParams.
   *
   * @param {string} Document
   * @param {string} action
   * @param {Object} [options] - { method, query, body, success, error, always, freeze }
   */
  #rpcCall(Document, action, options = {}) {
    const workspace = this.#currentWorkspace();
    const url = ["web", "auth"].includes(workspace)
      ? `/${workspace}/${action}`
      : `/${workspace}/${Document}/${action}`;
    return this.#dispatchCall(url, options);
  }

  #navigate = null;
  workspace = "desk";

  /** Injected by <RouterBridge/> when mounted. */
  _bindRouter({ navigate }) {
    this.#navigate = navigate;
  }

  _unbindRouter() {
    this.#navigate = null;
  }

  /**
   * Navigates to a route using react-router.
   * @param {string} to - Absolute or relative path to the active workspace.
   * @param {{ replace?: boolean, state?: any }} [options]
   */
  navigate(to, options = {}) {
    const target = this.#resolveUrl(to);

    if (this.#navigate) {
      this.#navigate(target, options);
      return;
    }

    if (typeof window !== 'undefined') {
      window.location.assign(target);
    }
  }

  #resolveUrl(route) {
    if (typeof route !== 'string') return route;

    if (!route.startsWith('/')) {
      if (typeof window === 'undefined') return route;
      const currentPath = window.location.pathname;
      const lastSlash = currentPath.lastIndexOf('/');
      const parent = lastSlash >= 0 ? currentPath.slice(0, lastSlash + 1) : '/';
      return parent + route;
    }

    const isLoggedIn = this.isLoggedIn();
    const isAuthRoute = route.split('/')[1] === 'auth' && !isLoggedIn;
    const isDeskRoute = route.split('/')[1] === 'desk' && isLoggedIn;
    const wsPrefix = isDeskRoute
      ? ""
      : (this.workspace === "desk" ? `/${this.workspace}` : "");

    return isAuthRoute ? route : wsPrefix + route;
  }

  isLoggedIn() {
    return !!(this.user && this.user.name);
  }

  get user() {
    return (this.rootApp && this.rootApp.meta.user) || {};
  }
}
