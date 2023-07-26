import { http } from '/router/http.js';

export default class Router {
   #route = window.location;
   route_history = [];
   route_options = null;
   current_route = null;
   http = http;

   constructor() {
      this.#bind_events();
   }
   set_route() {
      return this.#set_route.apply(this, arguments);
   }

   get route() {
      return this.#route;
   }

   send_route() {
      this.current_route = this.get_sub_path();
      this.set_history(this.current_route);
      this.change();
   }

   set_history() {
      this.route_history.push(this.current_route);
   }

   #set_route() {
      this.push_state(this.make_url(arguments));
   }

   make_url(params) {
      const isPlainObject = function (obj) {
         return Object.prototype.toString.call(obj) === '[object Object]';
      };

      return Object.keys(params).map((key) => {
         if (isPlainObject(params[key])) {
            this.route_options = params[key];
            return null;
         } else {
            let a = String(params[key]);
            if (a && a.match(/[%'"\s\t]/)) { }
            return a;
         }
      }).join('/') || "/desk";
   }

   push_state(url) {
      if (window.location.pathname !== url) {
         window.location.hash = '';

         history.pushState(null, null, url);
      }

      this.send_route();
   }

   get_sub_path_string(route) {
      if (!route) {
         route = window.location.hash || (window.location.pathname + window.location.search);
      }
      return this.strip_prefix(route);
   }

   strip_prefix(route) {
      if (route.startsWith('desk')) route = route.substr(5);
      if (["/", "#", "!"].includes(route.substr(0, 1) === '/')) route = route.substr(1);

      return route;
   }

   get_sub_path(route) {
      return this.get_sub_path_string(route).split('/').map(c => this.decode_component(c));
   }

   decode_component(r) {
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
      this.#route = window.location;
      return this.loadDocument();
   }

   async loadDocument() {
      this.root_app.progress(20);
      //const res = await this.#fetch();
      this.root_app.setDocument(await this.#fetch())
   }
   #fetch() {
      return new Promise((resolve, reject) => {
         http.send({
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

   /*current_page(route = window.location) {
      if (!this.route.pathname) this.route = route;
      const ROUTE = this.route;

      const query = ROUTE.search ? ROUTE.search.split('?') : '';
      this.route.query = query[1] || '';

      const id = this.route.query.split('&').map(q => q.split('=')).filter(q => q[0] === 'documentName').join();

      return hash(`${this.route.pathname}${id}`.toLowerCase());
   }*/

   #bind_events() {
      window.addEventListener('popstate', (e) => {
         e.preventDefault();

         this.send_route();
         return false;
      });
   }

   navigate(route) {
      const isLoggedIn = this.isLoggedIn();
      const is_auth_route = route.split('/')[1] === 'auth' && !isLoggedIn;
      const is_desk_route = route.split('/')[1] === 'desk' && isLoggedIn;
      const workspace = is_desk_route ? "" : (this.workspace === "desk" ? `/${this.workspace}` : "");

      const ROUTE = is_auth_route ? route : route.split('/')[0] === '' ? workspace + route : route;

      if (is_auth_route && isLoggedIn) return;

      this.set_route(ROUTE);
   }

   isLoggedIn() {
      return this.user.name;
   }

   get user() {
      return this.root_app && this.root_app.meta.user || {};
   }
}