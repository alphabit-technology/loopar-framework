import HTTP from '@@tools/router/http';

export default class Router extends HTTP {
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
