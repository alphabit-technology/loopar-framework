var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _jsonParams, _options, _sendPetition, sendPetition_fn, _route, _setRoute, setRoute_fn, _fetch, fetch_fn, _bindEvents, bindEvents_fn, _loadedMeta, _reserses;
import * as React from "react";
import React__default from "react";
import ReactDOMServer from "react-dom/server";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { StaticRouter } from "react-router-dom";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import Cookies from "universal-cookie";
function cn(...inputs) {
  return twMerge(clsx(inputs));
}
function TailwindIndicator() {
  if (process.env.NODE_ENV === "production")
    return null;
  return /* @__PURE__ */ jsxs("div", { className: "fixed bottom-1 left-1 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-gray-800 p-3 font-mono text-xs text-white", children: [
    /* @__PURE__ */ jsx("div", { className: "block sm:hidden", children: "xs" }),
    /* @__PURE__ */ jsx("div", { className: "hidden sm:block md:hidden", children: "sm" }),
    /* @__PURE__ */ jsx("div", { className: "hidden md:block lg:hidden", children: "md" }),
    /* @__PURE__ */ jsx("div", { className: "hidden lg:block xl:hidden", children: "lg" }),
    /* @__PURE__ */ jsx("div", { className: "hidden xl:block 2xl:hidden", children: "xl" }),
    /* @__PURE__ */ jsx("div", { className: "hidden 2xl:block", children: "2xl" })
  ] });
}
const App = ({ __META__, Workspace, Document, ENVIRONMENT }) => {
  const workspace = JSON.parse(__META__.workspace);
  const meta = JSON.parse(__META__.meta);
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(
    "main",
    {
      className: cn(
        "min-h-screen bg-background font-sans antialiased"
      ),
      children: [
        /* @__PURE__ */ jsx("div", { className: "relative flex min-h-screen flex-col", children: /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
          Workspace,
          {
            ...workspace,
            __META__,
            documents: {
              [__META__.key]: {
                Module: Document,
                __META__,
                meta: { ...meta, key: __META__.key },
                active: true
              }
            },
            ENVIROMENT: ENVIRONMENT
          }
        ) }) }),
        /* @__PURE__ */ jsx(TailwindIndicator, {})
      ]
    }
  ) });
};
const __variableDynamicImportRuntimeHelper = (glob, path) => {
  const v = glob[path];
  if (v) {
    return typeof v === "function" ? v() : Promise.resolve(v);
  }
  return new Promise((_, reject) => {
    (typeof queueMicrotask === "function" ? queueMicrotask : setTimeout)(reject.bind(null, new Error("Unknown variable dynamic import: " + path)));
  });
};
const Workspaces = {};
async function WorkspaceLoader(workspace) {
  return new Promise((resolve) => {
    if (Workspaces[workspace]) {
      return resolve(Workspaces[workspace]);
    } else {
      __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./workspace/base/base-workspace.jsx": () => import("./assets/base-workspace-fAyqh84Y.js"), "./workspace/desk/desk-workspace.jsx": () => import("./assets/desk-workspace-MC4oNqGm.js"), "./workspace/web/web-workspace.jsx": () => import("./assets/web-workspace-xh1AVI0S.js") }), `./workspace/${workspace}/${workspace}-workspace.jsx`).then((Workspace) => {
        Workspaces[workspace] = Workspace;
        return resolve(Workspace);
      });
    }
  });
}
class HTTP {
  constructor() {
    __privateAdd(this, _sendPetition);
    __privateAdd(this, _jsonParams, {});
    __privateAdd(this, _options, {});
  }
  send(options) {
    __privateSet(this, _options, options);
    __privateMethod(this, _sendPetition, sendPetition_fn).call(this, options);
  }
  get method() {
    return __privateGet(this, _options).method || "POST";
  }
  get action() {
    return __privateGet(this, _options).action;
  }
  get body() {
    return __privateGet(this, _options).body;
  }
  get params() {
    const params = __privateGet(this, _options).params;
    if (loopar.utils.isJSON(params)) {
      __privateSet(this, _jsonParams, loopar.utils.JSONParse(params));
    } else {
      __privateSet(this, _jsonParams, params);
    }
    if (typeof __privateGet(this, _jsonParams) == "object") {
      return "?" + Object.keys(params).map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    } else {
      return __privateGet(this, _jsonParams);
    }
  }
  get url() {
    return `${this.action}${this.params || ""}`;
  }
  get options() {
    const options = {
      method: this.method,
      // *GET, POST, PUT, DELETE, etc.
      mode: "same-origin",
      // no-cors, *cors, same-origin
      cache: "default",
      // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "include",
      // include, *same-origin, omit
      /*headers: {
         //'Content-Type': 'application/json',
         //'x-xsrf-token':  "someCsrfToken",
         //'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Type': 'multipart/form-data',
      },*/
      redirect: "follow",
      // manual, *follow, error
      referrerPolicy: "no-referrer",
      // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: this.body
      // body data type must match "Content-Type" header),
    };
    if (!(this.body instanceof FormData)) {
      options.headers = {
        "Content-Type": "application/json"
      };
      options.body = JSON.stringify(this.body);
    }
    return options;
  }
  async get(url, params, options = {}) {
    return new Promise((resolve, reject) => {
      return this.send({
        method: "GET",
        action: url,
        params,
        success: resolve,
        error: reject,
        ...options
      });
    });
  }
  async post(url, params, options = {}) {
    return new Promise((resolve, reject) => {
      this.send({
        method: "POST",
        action: url,
        params,
        body: options.body || params,
        success: resolve,
        error: reject,
        ...options
      });
    });
  }
  json_parse(json) {
    return this.if_json(json) ? JSON.parse(json) : json;
  }
  if_json(json) {
    try {
      JSON.parse(json);
      return true;
    } catch (e) {
      return false;
    }
  }
}
_jsonParams = new WeakMap();
_options = new WeakMap();
_sendPetition = new WeakSet();
sendPetition_fn = function(options) {
  const self = this;
  options.freeze && loopar.freeze(true);
  fetch(self.url, self.options).then(async (response) => {
    return new Promise(async (resolve, reject) => {
      var _a;
      if (response.redirected) {
        window.location.href = response.url;
        return;
      }
      const isJson = (_a = response.headers.get("content-type")) == null ? void 0 : _a.includes("application/json");
      const data = isJson ? await response.json() : null;
      if (!response.ok) {
        const error = data || { error: response.status, message: response.statusText };
        reject(error);
      } else {
        options.success && options.success(data);
        if (data && data.notify) {
          loopar.notify(data.notify);
        }
        resolve(data);
      }
    });
  }).catch((error) => {
    var _a;
    options.error && options.error(error);
    (_a = loopar.rootApp) == null ? void 0 : _a.progress(102);
    loopar.throw({
      title: error.error || "Undefined Error",
      message: error.message || "Undefined Error"
    });
  }).finally(() => {
    options.freeze && loopar.freeze(false);
    options.always && options.always();
  });
};
const http = new HTTP();
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        primary: "bg-primary text-primary-foreground hover:bg-primary/80",
        primeblue: "bg-primeblue text-primeblue-foreground hover:bg-primeblue/80",
        success: "bg-success text-success-foreground hover:bg-success/80",
        warning: "bg-warning text-warning-foreground hover:bg-warning/80",
        danger: "bg-danger text-danger-foreground hover:bg-danger/80",
        info: "bg-info text-info-foreground hover:bg-info/80"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return /* @__PURE__ */ jsx(
      Comp,
      {
        className: cn(buttonVariants({ variant, size, className })),
        ref,
        ...props
      }
    );
  }
);
Button.displayName = "Button";
class Router {
  constructor() {
    __privateAdd(this, _setRoute);
    __privateAdd(this, _fetch);
    __privateAdd(this, _bindEvents);
    __privateAdd(this, _route, global.location);
    __publicField(this, "routeHistory", []);
    __publicField(this, "routeOptions", null);
    __publicField(this, "currentRoute", null);
    __publicField(this, "http", http);
    __privateMethod(this, _bindEvents, bindEvents_fn).call(this);
  }
  setRoute() {
    return __privateMethod(this, _setRoute, setRoute_fn).apply(this, arguments);
  }
  get route() {
    return __privateGet(this, _route);
  }
  sendRoute() {
    this.currentRoute = this.getSubPath();
    this.setHistory(this.currentRoute);
    this.change();
  }
  setHistory() {
    this.routeHistory.push(this.currentRoute);
  }
  makeUrl(params) {
    const isPlainObject = function(obj) {
      return Object.prototype.toString.call(obj) === "[object Object]";
    };
    return Object.keys(params).map((key) => {
      if (isPlainObject(params[key])) {
        this.routeOptions = params[key];
        return null;
      } else {
        let a = String(params[key]);
        if (a && a.match(/[%'"\s\t]/))
          ;
        return a;
      }
    }).join("/") || "/desk";
  }
  pushState(url) {
    if (global.location.pathname !== url) {
      global.location.hash = "";
    }
    this.sendRoute();
  }
  getSubPathString(route) {
    if (!route) {
      route = global.location.hash || global.location.pathname + global.location.search;
    }
    return this.stripPrefix(route);
  }
  stripPrefix(route) {
    if (route.startsWith("desk"))
      route = route.substr(5);
    if (["/", "#", "!"].includes(route.substr(0, 1) === "/"))
      route = route.substr(1);
    return route;
  }
  getSubPath(route) {
    return this.getSubPathString(route).split("/").map((c) => this.decodeComponent(c));
  }
  decodeComponent(r) {
    try {
      return decodeURIComponent(r);
    } catch (e) {
      if (e instanceof URIError) {
        return r;
      } else {
        throw e;
      }
    }
  }
  slug(name) {
    return name.toLowerCase().replace(/ /g, "-");
  }
  change() {
    __privateSet(this, _route, global.location);
    return this.loadDocument();
  }
  async loadDocument() {
    this.rootApp.progress(20);
    this.rootApp.setDocument(await __privateMethod(this, _fetch, fetch_fn).call(this));
  }
  navigate(route, query = {}) {
    const isLoggedIn = this.isLoggedIn();
    const isAuthRoute = route.split("/")[1] === "auth" && !isLoggedIn;
    const isDeskRoute = route.split("/")[1] === "desk" && isLoggedIn;
    const workspace = isDeskRoute ? "" : this.workspace === "desk" ? `/${this.workspace}` : "";
    const ROUTE = isAuthRoute ? route : route.split("/")[0] === "" ? workspace + route : route;
    if (isAuthRoute && isLoggedIn)
      return;
    this.setRoute(ROUTE);
  }
  isLoggedIn() {
    return this.user.name;
  }
  get user() {
    return this.rootApp && this.rootApp.meta.user || {};
  }
}
_route = new WeakMap();
_setRoute = new WeakSet();
setRoute_fn = function() {
  this.pushState(this.makeUrl(arguments));
};
_fetch = new WeakSet();
fetch_fn = function() {
  return new Promise((resolve, reject) => {
    http.send({
      action: this.route.pathname,
      params: this.route.search,
      success: (r) => {
        resolve(r);
      },
      error: (r) => {
        reject(r);
      },
      freeze: true
    });
  });
};
_bindEvents = new WeakSet();
bindEvents_fn = function() {
  global.addEventListener && global.addEventListener("popstate", (e) => {
    e.preventDefault();
    this.sendRoute();
    return false;
  });
};
class GuiManage {
  constructor(options) {
    __publicField(this, "dropdownActions", {});
    Object.assign(this, options);
  }
  dropdownAction(name, dropdown) {
    this.dropdownActions[name] = dropdown;
  }
  closeAllDropdowns(except = null) {
    Object.entries(this.dropdownActions).forEach(([name, dropdownAction]) => {
    });
  }
  uuid() {
    return "el" + Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
  }
}
const GuiManage$1 = new GuiManage();
const cookies = new Cookies(null, { path: "/" });
const set = (name, value, options = {}) => {
  cookies.set(name, value, options);
};
const get = (name, ootions = {}) => {
  return cookies.get(name, ootions);
};
const remove = (name, options = {}) => {
  cookies.remove(name, options);
};
const CookieManager = {
  set,
  get,
  remove
};
const _text = (text2) => {
  return text2 || "Undefined";
};
const handlePreserveConsecutiveUppercase = (decamelized, separator) => {
  decamelized = decamelized.replace(
    new RegExp("((?<![\\p{Uppercase_Letter}\\d])[\\p{Uppercase_Letter}\\d](?![\\p{Uppercase_Letter}\\d]))", "gu"),
    ($0) => $0.toLowerCase()
  );
  return decamelized.replace(
    new RegExp("(\\p{Uppercase_Letter}+)(\\p{Uppercase_Letter}\\p{Lowercase_Letter}+)", "gu"),
    (_, $1, $2) => $1 + separator + $2.toLowerCase()
  );
};
function camelCase(str) {
  return str.toLowerCase().replace(/[_-](.)/g, (_, letter) => letter.toUpperCase());
}
function decamelize(text2, { separator = "-", preserveConsecutiveUppercase = false } = {}) {
  text2 = _text(text2).replaceAll(/\s/g, "");
  if (!(typeof text2 === "string" && typeof separator === "string")) {
    throw new TypeError(
      "The `text` and `separator` arguments should be of type `string`"
    );
  }
  if (text2.length < 2) {
    return preserveConsecutiveUppercase ? text2 : text2.toLowerCase();
  }
  const replacement = `$1${separator}$2`;
  const decamelized = text2.replace(
    new RegExp("([\\p{Lowercase_Letter}\\d])(\\p{Uppercase_Letter})", "gu"),
    replacement
  );
  if (preserveConsecutiveUppercase) {
    return handlePreserveConsecutiveUppercase(decamelized, separator);
  }
  return decamelized.replace(
    new RegExp("(\\p{Uppercase_Letter})(\\p{Uppercase_Letter}\\p{Lowercase_Letter}+)", "gu"),
    replacement
  ).toLowerCase();
}
function kebabToPascal(kebabString) {
  return kebabString.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join("");
}
function Capitalize(text2) {
  return _text(text2).charAt(0).toUpperCase() + _text(text2).slice(1);
}
function UPPERCASE(text2) {
  return _text(text2).toUpperCase();
}
function lowercase(text2) {
  return _text(text2).toLowerCase();
}
function debug_name(name) {
  return _text(name).replace(/\s|-/g, "_");
}
function hash(input) {
  return crypto.MD5(input).toString();
}
function trueValue(value) {
  return [true, "true", 1, "1"].includes(value);
}
function trueToBinary(value) {
  return trueValue(value) ? 1 : 0;
}
function nullValue(value) {
  return [null, "null", void 0, "undefined"].includes(value);
}
function avatar(name, size = 32) {
  return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
}
function humanize(string) {
  if (typeof string !== "string") {
    throw new TypeError("Expected a string");
  }
  string = decamelize(string);
  string = string.toLowerCase().replace(/[_-]+/g, " ").replace(/\s{2,}/g, " ").trim();
  string = string.charAt(0).toUpperCase() + string.slice(1);
  return string;
}
function isJSON(str) {
  try {
    JSON.parse(str);
  } catch (e) {
    return false;
  }
  return true;
}
function fixJSON(json) {
  json = json.replace(`""""`, `""`).replace("&#34;&#34;&#34;&#34", ";&#34;&#34;");
  if (json.includes('""""') || json.includes("&#34;&#34;&#34;&#34")) {
    json = fixJSON(json);
  }
  return json;
}
function JSONstringify(obj) {
  return Flatted.stringify(obj);
}
function JSONparse(obj) {
  fixJSON(obj);
  return typeof obj == "object" ? obj : JSON.parse(fixJSON(obj));
}
function randomString(length = 15) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy";
  const characters = `0123456789${alphabet}${Date.now()}`.split("").sort(() => Math.random() - Math.random()).join("");
  const start = Math.floor(Math.random() * (characters.length - length));
  return `${alphabet.charAt(Math.floor(Math.random() * alphabet.length))}${characters.slice(start + 1, start + length)}`;
}
function avatarLetter(word) {
  let value = "";
  if (word) {
    word.split(" ").forEach((word2) => {
      value += word2[0].toUpperCase();
    });
  }
  return value;
}
function fieldList(fields) {
  fields = isJSON(fields) ? JSONparse(fields) : fields;
  return (fields || []).reduce((acc, field) => {
    return acc.concat(field, fieldList(field.elements || []));
  }, []);
}
function rgba(hex, alpha = 1) {
  let base = typeof hex == "object" ? hex : isJSON(hex) ? JSONparse(hex) : hex || {};
  hex = base.color || hex;
  alpha = base.alpha || alpha;
  try {
    const hexRegex = /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;
    if (!hexRegex.test(hex)) {
      throw new Error("Formato hexadecimal de color incorrecto");
    }
    hex = hex.replace(/^#/, "");
    const bigint = parseInt(hex, 16);
    const r = bigint >> 16 & 255;
    const g = bigint >> 8 & 255;
    const b = bigint & 255;
    const a = alpha || 1;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } catch (error) {
    return null;
  }
}
function aspectRatio(ratio) {
  const [width, height] = ratio.split(":");
  return height / width * 100;
}
const Helpers = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Capitalize,
  JSONparse,
  JSONstringify,
  UPPERCASE,
  aspectRatio,
  avatar,
  avatarLetter,
  camelCase,
  cookie: CookieManager,
  debug_name,
  decamelize,
  fieldList,
  hash,
  humanize,
  isJSON,
  kebabToPascal,
  lowercase,
  nullValue,
  randomString,
  rgba,
  trueToBinary,
  trueValue
}, Symbol.toStringTag, { value: "Module" }));
class ScriptManager {
  constructor() {
    this.scripts = [];
  }
  loadStylesheet(href, { callback, options = { defer: true, position: "before", target: null } } = {}) {
    return new Promise((resolve, reject) => {
      const existingLink = document.querySelector(`link[href="${href}.css"]`);
      if (existingLink) {
        resolve();
        callback && callback();
        return;
      }
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href + ".css";
      link.defer = options.defer;
      link.onload = () => {
        resolve();
        callback && callback();
      };
      link.onerror = () => {
        reject();
      };
      if (options.target) {
        const target = document.head.querySelector(options.target);
        if (options.position === "before") {
          target.parentNode.insertBefore(link, target);
        } else {
          target.parentNode.insertBefore(link, target.nextSibling);
        }
      } else {
        document.head.insertBefore(link, document.head.firstChild);
      }
    });
  }
  loadScript(src, callback, options = { async: true }) {
    return new Promise((resolve, reject) => {
      const existingScript = document.querySelector(`script[src="${src}.js"]`);
      this.scripts[src] = this.scripts[src] || { loaded: false, callbacks: [] };
      const makeScript = () => {
        const script = document.createElement("script");
        script.src = src + ".js";
        script.async = options.async;
        script.onload = () => {
          this.scripts[src].callbacks.forEach((callback2) => {
            callback2();
          });
          this.scripts[src].loaded = true;
          resolve();
        };
        script.onerror = () => {
          this.scripts[src].loaded = false;
          reject();
        };
        document.head.appendChild(script);
      };
      if (existingScript) {
        if (this.scripts[src].loaded) {
          callback && callback();
        } else {
          callback && this.scripts[src].callbacks.push(callback);
        }
        resolve();
      } else {
        callback && this.scripts[src].callbacks.push(callback);
        makeScript();
      }
    });
  }
  unloadScripts() {
    this.scripts.forEach((script) => {
      script.remove();
    });
    this.scripts = [];
  }
}
const scriptManager = new ScriptManager();
class Loopar extends Router {
  constructor() {
    super();
    __publicField(this, "ui", GuiManage$1);
    __publicField(this, "scriptManager", scriptManager);
    __publicField(this, "currentPageName", "");
    __publicField(this, "rootApp", null);
    __publicField(this, "sidebarOption", "preview");
    __publicField(this, "Components", {});
    __privateAdd(this, _loadedMeta, {});
    __publicField(this, "generatedColors", {});
    __privateAdd(this, _reserses, {
      top: "bottom",
      bottom: "top",
      left: "right",
      right: "left",
      up: "down",
      down: "up",
      in: "out",
      out: "in"
    });
    this.utils = Helpers;
  }
  getComponent(component, pre = "./") {
    const cParse = component.replaceAll(/_/g, "-");
    return new Promise((resolve) => {
      if (this.Components[component]) {
        resolve(this.Components[component]);
      } else {
        __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./components/banner-image.jsx": () => import("./assets/banner-image-qRraw1Q1.js"), "./components/banner.jsx": () => import("./assets/banner-tUMcbvJg.js"), "./components/button.jsx": () => import("./assets/button-ctgTT0eo.js"), "./components/card.jsx": () => import("./assets/card-Ttt6QVjx.js"), "./components/carrusel.jsx": () => import("./assets/carrusel-UmDVWPa1.js"), "./components/carrusel1.jsx": () => import("./assets/carrusel1-ooYBs-c2.js"), "./components/checkbox.jsx": () => import("./assets/checkbox-pv07LVcc.js"), "./components/col.jsx": () => import("./assets/col-I38p8M41.js"), "./components/color-picker.jsx": () => import("./assets/color-picker-3SBPD3tc.js"), "./components/date-time.jsx": () => import("./assets/date-time-sCFZvH7b.js"), "./components/date.jsx": () => import("./assets/date-JuTKudYb.js"), "./components/designer.jsx": () => import("./assets/designer-D-oKMvXv.js"), "./components/dialog.jsx": () => import("./assets/dialog-nmg_tOQf.js"), "./components/div.jsx": () => import("./assets/div-rCeXGfsc.js"), "./components/divider.jsx": () => import("./assets/divider-VNdcDkEg.js"), "./components/document-history.jsx": () => import("./assets/document-history-O6hfsd4a.js"), "./components/element-title.jsx": () => import("./assets/element-title-oSDJ5F20.js").then((n) => n.e), "./components/error-boundary.jsx": () => import("./assets/error-boundary-6D0cC7RX.js"), "./components/file-browser.jsx": () => import("./assets/file-browser-uAbuTUuu.js").then((n) => n.b), "./components/file-input.jsx": () => import("./assets/file-browser-uAbuTUuu.js").then((n) => n.f), "./components/file-uploader.jsx": () => import("./assets/file-browser-uAbuTUuu.js").then((n) => n.a), "./components/form-table.jsx": () => import("./assets/form-table-Lbr47LtR.js"), "./components/form.jsx": () => import("./assets/form-w40geAFS.js"), "./components/gallery.jsx": () => import("./assets/gallery-PjHRoTwb.js"), "./components/generic.jsx": () => import("./assets/generic-7Z4F1wMi.js"), "./components/icon.jsx": () => import("./assets/icon--MZ6rWpO.js"), "./components/id.jsx": () => import("./assets/id-OcD3bgXt.js"), "./components/image-input.jsx": () => import("./assets/image-input-JdchdXOH.js"), "./components/image.jsx": () => import("./assets/image-CHQ3J83s.js"), "./components/input.jsx": () => import("./assets/input-NFPW1Jmu.js"), "./components/link.jsx": () => import("./assets/link-w8K-UYiW.js"), "./components/markdown-input.jsx": () => import("./assets/markdown-input-jsy-Xgy9.js"), "./components/markdown.jsx": () => import("./assets/markdown-kLIT3DFr.js"), "./components/no-data.jsx": () => import("./assets/no-data-1PxXW9n3.js"), "./components/notify.jsx": () => import("./assets/notify-sV-RaOtA.js"), "./components/pagination.jsx": () => import("./assets/pagination-6me7nd6k.js"), "./components/panel.jsx": () => import("./assets/panel-j3BFN7PK.js"), "./components/paragraph.jsx": () => import("./assets/paragraph-9Q9YOdMW.js"), "./components/password.jsx": () => import("./assets/password-a_fVnSji.js"), "./components/row.jsx": () => import("./assets/row-Az5Yfezb.js"), "./components/section.jsx": () => import("./assets/section-mc4aPAmk.js"), "./components/select.jsx": () => import("./assets/select-78vbYZZq.js"), "./components/slider.jsx": () => import("./assets/slider-CQA6FBAC.js"), "./components/stripe-embebed.jsx": () => import("./assets/stripe-embebed-VFKe3f9i.js"), "./components/stripe.jsx": () => import("./assets/stripe-0CveTF1N.js"), "./components/subtitle.jsx": () => import("./assets/subtitle-MO8Uk-Xs.js"), "./components/svg-icon.jsx": () => import("./assets/svg-icon-tU2Iwb5g.js"), "./components/switch.jsx": () => import("./assets/switch-TAZ35xwr.js"), "./components/tab.jsx": () => import("./assets/tab-V5u07JBG.js"), "./components/tabs.jsx": () => import("./assets/tabs-yHXtTGWg.js"), "./components/text-block-icon.jsx": () => import("./assets/text-block-icon-6fd6qioB.js"), "./components/text-block.jsx": () => import("./assets/text-block-k09bzyTc.js"), "./components/text-editor.jsx": () => import("./assets/text-editor-R5SbnhpM.js"), "./components/textarea.jsx": () => import("./assets/textarea-oH5Cdbvl.js"), "./components/time.jsx": () => import("./assets/time-bvcwOA3J.js"), "./components/title.jsx": () => import("./assets/title-U6T_czZv.js") }), `./components/${cParse}.jsx`).then((c) => {
          this.Components[component] = c;
          resolve(c);
        });
      }
    });
  }
  async loadComponents(components, callback) {
    const promises = Array.from(new Set(components)).map(
      (c) => this.getComponent(c)
    );
    Promise.all(promises).then(callback);
  }
  dialog(dialog) {
    const content = dialog.content || dialog.message;
    dialog.id ?? (dialog.id = typeof content === "string" ? dialog.content : dialog.title);
    dialog.open = dialog.open !== false;
    this.rootApp && this.rootApp.setDialog(dialog);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.rootApp && this.rootApp.dialogs.dialogs[dialog.id]);
      }, 0);
    });
  }
  prompt(dialog) {
    dialog.id = "test-dialog";
    dialog.open = true;
    dialog.type = "prompt";
    dialog.content = /* @__PURE__ */ jsx(Fragment, {});
    this.rootApp && this.rootApp.setDialog(dialog);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.rootApp.dialogs.dialogs[dialog.id]);
      }, 0);
    });
  }
  confirm(message, callback) {
    this.dialog({
      type: "confirm",
      title: "Confirm",
      content: message,
      ok: callback
    });
  }
  alert(message, callback) {
    this.dialog({
      type: "alert",
      title: "Alert",
      content: message,
      callback
    });
  }
  closeDialog(id) {
    this.rootApp && this.rootApp.closeDialog(id);
  }
  throw(error, m) {
    const { title, content, message } = typeof error === "object" ? error : { title: error, content: m, message: m };
    this.dialog({
      type: "error",
      title,
      content: content || message,
      open: true
    });
    throw new Error(error.content || error.message || error);
  }
  notify(message, type = "success") {
    const data = typeof message === "object" ? message : { message, type };
    this.rootApp && this.rootApp.setNotify(data);
  }
  toggleTheme() {
    window.toggleTheme();
    this.rootApp && this.rootApp.setState({});
  }
  sidebar() {
    return true;
  }
  initialize() {
    return new Promise((resolve) => {
      document.ready(() => {
        resolve();
      });
    });
  }
  emit(event, data) {
    this.rootApp && this.rootApp.emit(event, data);
  }
  bgColor(name, alpha = 0.8) {
    function hashCode(str) {
      let hash2 = 0;
      for (let i = 0; i < str.length; i++) {
        hash2 = (hash2 << 5) - hash2 + str.charCodeAt(i);
        hash2 |= 0;
      }
      return hash2;
    }
    function stringToColor(str) {
      const hash2 = hashCode(str);
      let color = "#";
      for (let i = 0; i < 3; i++) {
        const value = hash2 >> i * 8 & 255;
        color += ("00" + value.toString(16)).substr(-2);
      }
      return color;
    }
    const getColorForWord = (word) => {
      if (!this.generatedColors[word]) {
        this.generatedColors[word] = stringToColor(word);
      }
      return this.generatedColors[word];
    };
    function mixColors(colors2) {
      let avgRed = 0, avgGreen = 0, avgBlue = 0;
      colors2.forEach((color) => {
        avgRed += parseInt(color.slice(1, 3), 16);
        avgGreen += parseInt(color.slice(3, 5), 16);
        avgBlue += parseInt(color.slice(5, 7), 16);
      });
      avgRed = Math.round(avgRed / colors2.length);
      avgGreen = Math.round(avgGreen / colors2.length);
      avgBlue = Math.round(avgBlue / colors2.length);
      const minColorValue = 50;
      const maxColorValue = 205;
      avgRed = Math.min(Math.max(avgRed, minColorValue), maxColorValue);
      avgGreen = Math.min(Math.max(avgGreen, minColorValue), maxColorValue);
      avgBlue = Math.min(Math.max(avgBlue, minColorValue), maxColorValue);
      return `rgba(${avgRed}, ${avgGreen}, ${avgBlue}, ${alpha})`;
    }
    const words = name.split(/\s+/);
    const colors = words.map(getColorForWord);
    return mixColors(colors);
  }
  freeze(freeze = true) {
    var _a;
    (_a = this.rootApp) == null ? void 0 : _a.freeze(freeze);
  }
  async method(Document, method, params = {}, options = {}) {
    const url = `/desk/method/${Document}/${method}`;
    params = typeof params === "string" ? { documentName: params } : params;
    return await http.post(url, params, { freeze: false, ...options });
  }
  async getMeta(Document, action, params = {}, options = {}) {
    if (!__privateGet(this, _loadedMeta)[Document + action]) {
      __privateGet(this, _loadedMeta)[Document + action] = await this.method(
        Document,
        action,
        params,
        options
      );
    }
    return __privateGet(this, _loadedMeta)[Document + action];
  }
  require(src, callback, options = { async: true }) {
    const loadScript = (src2, callback2, options2) => {
      return new Promise((resolve) => {
        window.loadScript(src2, callback2, options2);
        resolve();
      });
    };
    if (Array.isArray(src)) {
      return Promise.all(src.map((s) => loadScript(s, callback, options)));
    } else {
      return loadScript(src, callback, options);
    }
  }
  includeCSS(src, callback) {
    return new Promise((resolve) => {
      window.loadStylesheet(src).then(() => {
        resolve();
      });
    });
  }
  animations(notContains) {
    const animations = {
      random: "Random",
      "fade-up": "Fade Up",
      "fade-down": "Fade Down",
      "fade-left": "Fade Left",
      "fade-right": "Fade Right",
      "fade-up-right": "Fade Up Right",
      "fade-up-left": "Fade Up Left",
      "fade-down-right": "Fade Down Right",
      "fade-down-left": "Fade Down Left",
      "flip-up": "Flip Up",
      "flip-down": "Flip Down",
      "flip-left": "Flip Left",
      "flip-right": "Flip Right",
      "slide-up": "Slide Up",
      "slide-down": "Slide Down",
      "slide-left": "Slide Left",
      "slide-right": "Slide Right",
      "zoom-in": "Zoom In",
      "zoom-in-up": "Zoom In Up",
      "zoom-in-down": "Zoom In Down",
      "zoom-in-left": "Zoom In Left",
      "zoom-in-right": "Zoom In Right",
      "zoom-out": "Zoom Out",
      "zoom-out-up": "Zoom Out Up",
      "zoom-out-down": "Zoom Out Down",
      "zoom-out-left": "Zoom Out Left",
      "zoom-out-right": "Zoom Out Right"
    };
    if (notContains) {
      return Object.keys(animations).filter((a) => !a.includes(notContains)).reduce((obj, key) => {
        obj[key] = animations[key];
        return obj;
      }, {});
    }
    return animations;
  }
  reverseAnimation(animation) {
    return !animation ? null : animation.split("-").map((a) => __privateGet(this, _reserses)[a] || a).join("-");
  }
  getAnimation(animation, notContains) {
    if (!animation)
      return null;
    if (animation === "random") {
      const transitions = Object.keys(this.animations(notContains)).filter(
        (animation2) => animation2 !== "random"
      );
      return transitions[Math.floor(Math.random() * transitions.length)];
    } else {
      return animation;
    }
  }
}
_loadedMeta = new WeakMap();
_reserses = new WeakMap();
const loopar = new Loopar();
const varcharLen = "(255)";
const [text, long_text, varchar, decimal, int, mediumint, longint, date, date_time, time] = ["text", "longtext", "varchar", "decimal", "int", "mediumint", "longint", "date", "datetime", "time"];
const [LAYOUT_ELEMENT, DESIGN_ELEMENT, FORM_ELEMENT, HTML] = ["layout", "design", "form", "html"];
const elementsDefinition = {
  [LAYOUT_ELEMENT]: [
    { element: "section", icon: "GalleryVertical" },
    { element: "div", icon: "Code" },
    { element: "row", icon: "Grid" },
    { element: "col", icon: "Columns" },
    { element: "card", icon: "PanelTop" },
    { element: "panel", icon: "InspectionPanel" },
    //{element: "table", icon: "fa fa-table"},
    { element: "banner", icon: "GalleryHorizontalEnd" },
    { element: "banner_image", icon: "ImagePlus" },
    { element: "tabs", icon: "AppWindow" },
    { element: "tab", icon: "Table2", show_in_design: false },
    { element: "generic", icon: "Code" }
  ],
  [DESIGN_ELEMENT]: [
    { element: "image", icon: "Image" },
    { element: "slider", icon: "GalleryHorizontalEnd" },
    { element: "carrusel", icon: "GalleryHorizontalEnd" },
    { element: "gallery", icon: "ImagePlus" },
    { element: "text_block", icon: "AlignJustify" },
    { element: "text_block_icon", icon: "Outdent" },
    { element: "button", icon: "MousePointer" },
    { element: "link", icon: "MousePointerClick" },
    //{element: "icon", icon: "fa fa-hand-pointer"},
    { element: "markdown", icon: "BookOpenCheck", clientOnly: true },
    { element: "title", icon: "Heading1" },
    { element: "subtitle", icon: "Heading2" },
    { element: "paragraph", icon: "Pilcrow" },
    //{element: "link", icon: "fa fa-link"},
    //{element: "list", icon: "fa fa-list"},
    { element: "stripe", icon: "CreditCard" },
    { element: "stripe_embebed", icon: "CreditCard" },
    { element: "element_title", icon: "fa fa-heading" }
  ],
  [FORM_ELEMENT]: [
    { element: "input", icon: "FormInput", type: [varchar, varcharLen] },
    { element: "password", icon: "Asterisk", type: [varchar, varcharLen] },
    { element: "date", icon: "Calendar", type: [date, ""], format: "YYYY-MM-DD" },
    { element: "date_time", icon: "CalendarClock", type: [date_time, ""], format: "YYYY-MM-DD HH:mm:ss" },
    { element: "time", icon: "Clock10", type: [time, "6"], format: "HH:mm:ss" },
    { element: "currency", icon: "Currency", type: [decimal, "(18,6)"], show_in_design: false },
    { element: "integer", icon: "fa-duotone fa-input-numeric", type: [int, "(11)"], show_in_design: false },
    { element: "decimal", icon: "fa fa-00", type: [decimal, "(18,6)"], show_in_design: false },
    { element: "select", icon: "ChevronDown", type: [varchar, varcharLen] },
    { element: "textarea", icon: "FileText", type: [long_text, ""] },
    { element: "text_editor", icon: "TextCursorInput", type: [long_text, ""] },
    { element: "checkbox", icon: "CheckSquare", type: [int, "(11)"] },
    { element: "switch", icon: "ToggleLeft", type: [int, "(11)"] },
    { element: "id", icon: "BookKey", type: [int] },
    { element: "form_table", icon: "Sheet", type: [varchar, varcharLen] },
    { element: "markdown_input", icon: "BookOpenCheck", type: [long_text, ""], clientOnly: true },
    { element: "designer", icon: "Brush", type: [long_text, ""] },
    { element: "file_input", icon: "FileInput", type: [long_text, ""] },
    { element: "file_uploader", icon: "FileUp", type: [long_text, ""] },
    { element: "image_input", icon: "FileImage", type: [long_text, ""] },
    { element: "color_picker", icon: "Palette", type: [varchar, varcharLen] }
  ]
};
const elementsDict = Object.freeze(Object.entries(elementsDefinition).reduce((acc, [key, value]) => {
  value.forEach((element) => {
    acc[element.element] = { def: { ...element, ...{ group: key, isWritable: key === FORM_ELEMENT } } };
  });
  return acc;
}, {}));
Object.freeze(Object.values(elementsDefinition).reduce((acc, current) => {
  acc = [...acc, ...current.map((element) => {
    if (!global[element.element.toUpperCase()]) {
      Object.defineProperty(global, element.element.toUpperCase(), {
        get: () => element.element,
        set: () => {
          throw element.element + " is a Safe CONST and cannot be re-declared.";
        }
      });
    }
    return element.element;
  })];
  return acc;
}, []));
global.ELEMENT_DEFINITION = function(element, or = null) {
  var _a;
  return ((_a = elementsDict[element] || elementsDict[or]) == null ? void 0 : _a.def) || new Error("Element " + element + " not found");
};
global.fieldIsWritable = (field) => {
  var _a, _b;
  return (_b = (_a = elementsDict[field.element]) == null ? void 0 : _a.def) == null ? void 0 : _b.isWritable;
};
function requireComponents(__META__) {
  var _a, _b;
  const meta = typeof __META__.meta == "object" ? __META__.meta : JSON.parse(__META__.meta);
  const action = ["update", "create"].includes(__META__.action) ? "form" : __META__.action;
  const filterByWritable = (structure) => {
    return structure.reduce((acc, element) => {
      var _a2;
      if (loopar.utils.trueValue((_a2 = element.data) == null ? void 0 : _a2.searchable)) {
        acc.push(element);
      }
      if (element.elements) {
        acc.push(...filterByWritable(element.elements));
      }
      return acc;
    }, []);
  };
  if (["view", "form"].includes(action)) {
    return JSON.parse(((_a = meta == null ? void 0 : meta.__DOCTYPE__) == null ? void 0 : _a.doc_structure) || "[]");
  } else if (action === "list") {
    return filterByWritable(JSON.parse(((_b = meta == null ? void 0 : meta.__DOCTYPE__) == null ? void 0 : _b.doc_structure) || "[]"));
  }
}
const Components = {};
let extractedElements = [];
const extractElements = (elements, environment) => {
  var _a;
  for (const el of elements || []) {
    const element = typeof el === "string" ? { element: el } : el;
    const def = ((_a = elementsDict[element.element]) == null ? void 0 : _a.def) || {};
    if (element.element && (environment !== "server" || !def.clientOnly)) {
      extractedElements.push(element.element);
      if (element.elements) {
        extractElements(element.elements, environment);
      }
    }
  }
};
function getComponent(component, pre = "./") {
  if (!component)
    return null;
  const cParse = component.replaceAll(/_/g, "-");
  return new Promise((resolve) => {
    if (Components[component]) {
      resolve(Components[component]);
    } else {
      __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./components/banner-image.jsx": () => import("./assets/banner-image-qRraw1Q1.js"), "./components/banner.jsx": () => import("./assets/banner-tUMcbvJg.js"), "./components/button.jsx": () => import("./assets/button-ctgTT0eo.js"), "./components/card.jsx": () => import("./assets/card-Ttt6QVjx.js"), "./components/carrusel.jsx": () => import("./assets/carrusel-UmDVWPa1.js"), "./components/carrusel1.jsx": () => import("./assets/carrusel1-ooYBs-c2.js"), "./components/checkbox.jsx": () => import("./assets/checkbox-pv07LVcc.js"), "./components/col.jsx": () => import("./assets/col-I38p8M41.js"), "./components/color-picker.jsx": () => import("./assets/color-picker-3SBPD3tc.js"), "./components/date-time.jsx": () => import("./assets/date-time-sCFZvH7b.js"), "./components/date.jsx": () => import("./assets/date-JuTKudYb.js"), "./components/designer.jsx": () => import("./assets/designer-D-oKMvXv.js"), "./components/dialog.jsx": () => import("./assets/dialog-nmg_tOQf.js"), "./components/div.jsx": () => import("./assets/div-rCeXGfsc.js"), "./components/divider.jsx": () => import("./assets/divider-VNdcDkEg.js"), "./components/document-history.jsx": () => import("./assets/document-history-O6hfsd4a.js"), "./components/element-title.jsx": () => import("./assets/element-title-oSDJ5F20.js").then((n) => n.e), "./components/error-boundary.jsx": () => import("./assets/error-boundary-6D0cC7RX.js"), "./components/file-browser.jsx": () => import("./assets/file-browser-uAbuTUuu.js").then((n) => n.b), "./components/file-input.jsx": () => import("./assets/file-browser-uAbuTUuu.js").then((n) => n.f), "./components/file-uploader.jsx": () => import("./assets/file-browser-uAbuTUuu.js").then((n) => n.a), "./components/form-table.jsx": () => import("./assets/form-table-Lbr47LtR.js"), "./components/form.jsx": () => import("./assets/form-w40geAFS.js"), "./components/gallery.jsx": () => import("./assets/gallery-PjHRoTwb.js"), "./components/generic.jsx": () => import("./assets/generic-7Z4F1wMi.js"), "./components/icon.jsx": () => import("./assets/icon--MZ6rWpO.js"), "./components/id.jsx": () => import("./assets/id-OcD3bgXt.js"), "./components/image-input.jsx": () => import("./assets/image-input-JdchdXOH.js"), "./components/image.jsx": () => import("./assets/image-CHQ3J83s.js"), "./components/input.jsx": () => import("./assets/input-NFPW1Jmu.js"), "./components/link.jsx": () => import("./assets/link-w8K-UYiW.js"), "./components/markdown-input.jsx": () => import("./assets/markdown-input-jsy-Xgy9.js"), "./components/markdown.jsx": () => import("./assets/markdown-kLIT3DFr.js"), "./components/no-data.jsx": () => import("./assets/no-data-1PxXW9n3.js"), "./components/notify.jsx": () => import("./assets/notify-sV-RaOtA.js"), "./components/pagination.jsx": () => import("./assets/pagination-6me7nd6k.js"), "./components/panel.jsx": () => import("./assets/panel-j3BFN7PK.js"), "./components/paragraph.jsx": () => import("./assets/paragraph-9Q9YOdMW.js"), "./components/password.jsx": () => import("./assets/password-a_fVnSji.js"), "./components/row.jsx": () => import("./assets/row-Az5Yfezb.js"), "./components/section.jsx": () => import("./assets/section-mc4aPAmk.js"), "./components/select.jsx": () => import("./assets/select-78vbYZZq.js"), "./components/slider.jsx": () => import("./assets/slider-CQA6FBAC.js"), "./components/stripe-embebed.jsx": () => import("./assets/stripe-embebed-VFKe3f9i.js"), "./components/stripe.jsx": () => import("./assets/stripe-0CveTF1N.js"), "./components/subtitle.jsx": () => import("./assets/subtitle-MO8Uk-Xs.js"), "./components/svg-icon.jsx": () => import("./assets/svg-icon-tU2Iwb5g.js"), "./components/switch.jsx": () => import("./assets/switch-TAZ35xwr.js"), "./components/tab.jsx": () => import("./assets/tab-V5u07JBG.js"), "./components/tabs.jsx": () => import("./assets/tabs-yHXtTGWg.js"), "./components/text-block-icon.jsx": () => import("./assets/text-block-icon-6fd6qioB.js"), "./components/text-block.jsx": () => import("./assets/text-block-k09bzyTc.js"), "./components/text-editor.jsx": () => import("./assets/text-editor-R5SbnhpM.js"), "./components/textarea.jsx": () => import("./assets/textarea-oH5Cdbvl.js"), "./components/time.jsx": () => import("./assets/time-bvcwOA3J.js"), "./components/title.jsx": () => import("./assets/title-U6T_czZv.js") }), `./components/${cParse}.jsx`).then((c) => {
        var _a, _b;
        const promises = [];
        if (((_b = (_a = c == null ? void 0 : c.default) == null ? void 0 : _a.prototype) == null ? void 0 : _b.requires) && typeof window !== "undefined") {
          const requires = c.default.prototype.requires;
          if (requires.css) {
            for (const css of requires.css) {
              promises.push(loopar.includeCSS(css));
            }
          }
          if (requires.js) {
            for (const js of requires.js) {
              promises.push(loopar.require(js));
            }
          }
          if (requires.modules) {
            promises.push(
              loadComponents(requires.modules.filter((m) => m !== component))
            );
          }
        }
        Promise.all(promises).then(() => {
          Components[component] = c;
          resolve(c);
        }).catch((error) => {
          console.error("Err on load Resourse: " + component, error);
        });
      });
    }
  });
}
async function loadComponents(components, callback) {
  const promises = Array.from(new Set(components)).map((c) => getComponent(c));
  return Promise.all(promises).then(callback);
}
async function ComponentsLoader(elementsList, environment) {
  extractElements(elementsList, environment);
  const elements = Array.from(new Set(extractedElements));
  await loadComponents(elements);
}
async function MetaComponentsLoader(__META__, environment) {
  await ComponentsLoader(requireComponents(__META__), environment);
}
const ContextSources = {};
async function ContextLoader(source) {
  return new Promise((resolve) => {
    if (ContextSources[source.context]) {
      resolve(ContextSources[source.context]);
    } else {
      __variableDynamicImportRuntimeHelper(/* @__PURE__ */ Object.assign({ "./context/list-context.jsx": () => import("./assets/list-context-ngALZ7B0.js"), "./context/view-context.jsx": () => import("./assets/view-context-SbQklbbv.js"), "./context/web-context.jsx": () => import("./assets/web-context-5iI2ZzcX.js") }), `./context/${source.context}.jsx`).then((Source) => {
        ContextSources[source.context] = Source;
        resolve(Source);
      });
    }
  });
}
const AppsSources = {};
async function AppSourceLoader(source) {
  return new Promise((resolve) => {
    if (source.client) {
      if (AppsSources[source.client]) {
        return resolve(AppsSources[source.client]);
      } else {
        import(`./${source.client}.jsx`).then((Source) => {
          AppsSources[source.client] = Source;
          return resolve(Source);
        });
      }
    } else {
      ContextLoader(source).then((Source) => {
        return resolve(Source);
      });
    }
  });
}
const Loader = (__META__, ENVIRONMENT) => {
  return new Promise((resolve) => {
    WorkspaceLoader(__META__.W).then((Workspace) => {
      MetaComponentsLoader(__META__, ENVIRONMENT).then(() => {
        AppSourceLoader(__META__.client_importer).then((Document) => {
          resolve({ Workspace: Workspace.default, Document: Document.default });
        });
      });
    });
  });
};
async function renderPage(url, __META__) {
  const { Workspace, Document } = await Loader(__META__, "server");
  const context = {};
  const appHtml = ReactDOMServer.renderToString(
    React__default.createElement(
      StaticRouter,
      {
        location: url,
        context
      },
      React__default.createElement(App, {
        __META__,
        Document,
        Workspace,
        ENVIRONMENT: "server"
      })
    )
  );
  if (context.url) {
    return {
      redirect: context.url
    };
  }
  return {
    appHtml
  };
}
export {
  AppSourceLoader as A,
  Button as B,
  Components as C,
  MetaComponentsLoader as M,
  buttonVariants as b,
  cn as c,
  elementsDict as e,
  http as h,
  loopar as l,
  renderPage
};
