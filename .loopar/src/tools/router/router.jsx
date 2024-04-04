import HTTP from '$tools/router/http';
import {makeUrl} from "@link"

export default class Router {
  #route = global.location;
  routeHistory = [];
  routeOptions = null;
  currentRoute = null;
  http = HTTP;

  constructor() {
    this.#bindEvents();
  }

  setRoute() {
    return this.#setRoute.apply(this, arguments);
  }

  get route() {
    return this.#route;
  }

  sendRoute() {
    this.currentRoute = this.getSubPath();
    this.setHistory(this.currentRoute);
    this.change();
  }

  setHistory() {
    this.routeHistory.push(this.currentRoute);
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

      //history.pushState(null, null, url);
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
    return name.toLowerCase().replace(/ /g, '-');
  }

  change() {
    this.#route = global.location;
    return this.loadDocument();
  }

  async loadDocument() {
    this.rootApp.progress(20);
    this.rootApp.setDocument(await this.#fetch())
  }
  #fetch() {
    return new Promise((resolve, reject) => {
      HTTP.send({
        action: this.route.pathname,
        params: this.route.search,
        success: r => {
          resolve(r);
        },
        error: r => {
          reject(r);
        },
        freeze: true
      });
    });
  }

  #bindEvents() {
    global.addEventListener && global.addEventListener('popstate', (e) => {
      e.preventDefault();

      this.sendRoute();
      return false;
    });
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