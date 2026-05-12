import Router from "@@tools/router/router";
import * as Helpers from "@global/helper";
import * as dateUtils from "@global/date-utils";
import scriptManager from "@@tools/script-manager";
import { elementsDict, AIPrompt } from "@global/element-definition";
import Emitter from '@services/emitter/emitter';
import animation from "./loopar/animation.js";
import { ClientDatabase } from "./loopar/ClientDatabase.js";
export { useRealtime } from "./loopar/useRealtime.js";

class Loopar extends Router {
  scriptManager = scriptManager;
  currentPageName = "";
  rootApp = null;
  sidebarOption = "preview";
  Components = {};
  #loadedMeta = {};
  generatedColors = {};

  constructor() {
    super();
    this.utils = Helpers;
    this.cookie = Helpers.cookie;
    this.dateUtils = dateUtils;
    this.db = new ClientDatabase(this);
    this.animation = animation;

    const dispatch = (method) => (Document, action, options = {}) =>
      this.#apiCall(Document, action, { ...options, method });

    this.api = {
      call: (Document, action, options = {}) => this.#apiCall(Document, action, options),
      get: dispatch("GET"),
      post: dispatch("POST"),
      put: dispatch("PUT"),
      patch: dispatch("PATCH"),
      delete: dispatch("DELETE"),
    };
  }

  /**
   * @param {string} Document - Document/entity name (controller key).
   * @param {string} action - Controller action name.
   * @param {Object|null} [params] - Sent as JSON body. Pass null for none.
   * @param {Object} [options] - { query, success, error, always, freeze }.
   * @returns {Promise} Resolves with the controller response.
   */
  call(Document, action, params = null, options = {}) {
    return this.api.post(Document, action, {
      ...options,
      ...(params !== null && params !== undefined ? { body: params } : {}),
    });
  }

  /**
   * RPC call to a controller action.
   *
   * @param {string} Document - Document/entity name
   * @param {string} action - Controller action (becomes URL path)
   * @param {Object} [options]
   * @param {"GET"|"POST"|"PUT"|"PATCH"|"DELETE"} [options.method="POST"]
   * @param {Object} [options.query={}] - URL query string params
   * @param {Object|FormData} [options.body=null] - Request body
   * @param {Function} [options.success] - Success callback (callback mode)
   * @param {Function} [options.error] - Error callback (callback mode)
   * @param {Function} [options.always] - Always callback (callback mode)
   * @param {boolean}  [options.freeze] - Freeze UI during request
   * @returns {Promise|undefined} Promise when no callbacks are passed.
   */
  #apiCall(Document, action, options = {}) {
    const {
      method = "POST",
      query = {},
      body,
      success,
      error,
      always,
      freeze,
    } = options;

    const url = `/api/${Document}/${action}`;
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

  dialog(dialog, callback) {
    const content = dialog.content || dialog.message;
    dialog.id ??= typeof content === "string" ? dialog.content : dialog.title;
    dialog.open = dialog.open !== false;
    dialog.ok ??= callback;
    this.emit('dialog', dialog);
  }

  prompt(dialog) {
    dialog.id = "test-dialog";
    dialog.open = true;
    dialog.type = "prompt";
    dialog.content = <></>
    this.emit('dialog', dialog);
  }

  confirm(message, callback) {
    this.emit('dialog', {
      icon: null,
      type: "confirm",
      title: "Confirm",
      content: message,
      ok: callback,
      ...(typeof message == 'object' ? message : {})
    });
  }

  alert(message, callback) {
    this.dialog({
      type: "alert",
      title: "Loopar",
      content: message,
      callback: callback,
    });
  }

  closeDialog(id) {
    this.handleOpenCloseDialog(id, false);
  }

  handleOpenCloseDialog(id, open) {
    this.emit('handle-open-close-dialog', id, open);
  }

  throw(error, m, throwError = true) {
    console.log(["Loopar.throw", error])
    this.emit('freeze', false);

    let normalized;
    if (typeof error === "object" && error !== null) {
      normalized = error;
    } else if (typeof m === "string") {
      normalized = { title: error, message: m };
    } else {
      normalized = { title: "Error", message: error };
    }

    const { type = "error", title = "Error", message } = normalized;

    this.emit('dialog', {
      ...normalized,
      type,
      title,
      message,
    });

    if (throwError) {
      throw new Error(message);
    } else {
      console.error("LOOPAR: uncaughtException", message);
    }
  }

  notify(message, type = "success") {
    const data = typeof message === "object" ? message : { message, type };
    this.emit('notify', data);
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
    Emitter.emit(event, data);
  }

  bgColor(name="loopar", alpha = 0.8) {
    function hashCode(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
      }
      return hash;
    }

    function stringToColor(str) {
      const hash = hashCode(str);
      let color = "#";

      for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
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

    function mixColors(colors) {
      let avgRed = 0,
        avgGreen = 0,
        avgBlue = 0;

      colors.forEach((color) => {
        avgRed += parseInt(color.slice(1, 3), 16);
        avgGreen += parseInt(color.slice(3, 5), 16);
        avgBlue += parseInt(color.slice(5, 7), 16);
      });

      avgRed = Math.round(avgRed / colors.length);
      avgGreen = Math.round(avgGreen / colors.length);
      avgBlue = Math.round(avgBlue / colors.length);

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

  reload() {
    this.#loadedMeta = {};
    this.emit('refresh', { force: true });
  }

  refresh() {
    this.emit('refresh');
  }

  freeze(freeze = true) {
    Emitter.emit('freeze', freeze);
  }

  async getMeta(Document, action, query = {}) {
    if (!this.#loadedMeta[Document + action]) {
      const loadMeta = async () => {
        return new Promise((resolve) => {
          this.api.get(Document, action, {
            query,
            success: (data) => {
              this.#loadedMeta[Document + action] = data;
              resolve();
            },
          });
        });
      };

      await loadMeta();
    }

    return this.#loadedMeta[Document + action];
  }

  require(src, callback, options = { async: true }) {
    const loadScript = (currentSrc, currentCallback, currentOptions) =>
      this.scriptManager.loadScript(currentSrc, currentCallback, currentOptions);

    if (Array.isArray(src)) {
      return Promise.all(src.map((s) => loadScript(s, callback, options)));
    } else {
      return loadScript(src, callback, options);
    }
  }

  includeCSS(src, callback) {
    return this.scriptManager.loadStylesheet(src, { callback });
  }
}

const loopar = new Loopar();
export default loopar;
export { loopar, elementsDict, AIPrompt };