import HTTP from '@tools/router/http';
//import {makeUrl} from "@link"

export default class Router extends HTTP {
  #route = global.location;
  routeOptions = null;
  currentRoute = null;

  setRoute() {
    return this.#setRoute.apply(this, arguments);
  }

  get route() {
    return this.#route;
  }

  sendRoute() {
    this.currentRoute = this.getSubPath();
    this.change();
  }

  #setRoute() {
    this.pushState(this.makeUrl(arguments));
  }

  makeUrl(params) {
    const isPlainObject = function (obj) {
      return Object.prototype.toString.call(obj) === '[object Object]';
    };

    return Object.keys(params).map((key) => {
      if (isPlainObject(params[key])) {
        this.routeOptions = params[key];
        return null;
      } else {
        let a = String(params[key]);
        if (a && a.match(/[%'"\s\t]/)) { }
        return a;
      }
    }).join('/') || "/desk";
  }

  pushState(url) {
    if (global.location.pathname !== url) {
      global.location.hash = '';
    }

    this.sendRoute();
  }

  getSubPathString(route) {
    if (!route) {
      route = global.location.hash || (global.location.pathname + global.location.search);
    }
    return this.stripPrefix(route);
  }

  stripPrefix(route) {
    if (route.startsWith('desk')) route = route.substr(5);
    if (["/", "#", "!"].includes(route.substr(0, 1) === '/')) route = route.substr(1);

    return route;
  }

  getSubPath(route) {
    return this.getSubPathString(route).split('/').map(c => this.decodeComponent(c));
  }

  decodeComponent(r) {
    try {
      return decodeURIComponent(r);
    } catch (e) {
      if (e instanceof URIError) {
        // legacy: not sure why URIError is ignored.
        return r;
      } else {
        throw e;
      }
    }
  }

  slug(name) {
    return (name || "").toLowerCase().replace(/ /g, '-');
  }

  change() {
    this.#route = global.location;
  }
  
  navigate(route, query = {}) {
    const isLoggedIn = this.isLoggedIn();
    const isAuthRoute = route.split('/')[1] === 'auth' && !isLoggedIn;
    const isDeskRoute = route.split('/')[1] === 'desk' && isLoggedIn;
    const workspace = isDeskRoute ? "" : (this.workspace === "desk" ? `/${this.workspace}` : "");

    const ROUTE = isAuthRoute ? route : route.split('/')[0] === '' ? workspace + route : route;

    if (isAuthRoute && isLoggedIn) return;

    this.setRoute(ROUTE);
  }

  isLoggedIn() {
    return this.user.name;
  }

  get user() {
    return this.rootApp && this.rootApp.meta.user || {};
  }
}