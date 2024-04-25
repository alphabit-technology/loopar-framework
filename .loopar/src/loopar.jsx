import Router from "$tools/router/router";
import GuiManage from "$tools/gui";
import http from "$tools/router/http";
import * as Helpers from "$global/helper";
import * as dateUtils from "$global/date-utils";
import scriptManager from "$tools/script-manager";
import { elementsDict } from "@global/element-definition";

class Loopar extends Router {
  ui = GuiManage;
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
    this.dateUtils = dateUtils;
  }

  /*getComponent(component, pre = "./") {
    const cParse = component.replaceAll(/_/g, "-");
    return new Promise((resolve) => {
      if (this.Components[component]) {
        resolve(this.Components[component]);
      } else {
        import(`./components/${cParse}.jsx`).then((c) => {
          this.Components[component] = c;
          resolve(c);
        });
      }
    });
  }*/

  /*async loadComponents(components, callback) {
    const promises = Array.from(new Set(components)).map((c) =>
      this.getComponent(c)
    );
    Promise.all(promises).then(callback);
  }*/

  dialog(dialog) {
    const content = dialog.content || dialog.message;
    dialog.id ??= typeof content === "string" ? dialog.content : dialog.title;
    dialog.open = dialog.open !== false;
    this.rootApp && this.rootApp.setDialog(dialog);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.rootApp && this.rootApp.dialogs.dialogs[dialog.id]);
      }, 0);
    });
  }

  prompt(dialog) {
    //const content = dialog.content || dialog.message;
    dialog.id = "test-dialog"// dialog.title;
    dialog.open = true;
    dialog.type = "prompt";
    dialog.content = <></>
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
      ok: callback,
    });
  }

  alert(message, callback) {
    this.dialog({
      type: "alert",
      title: "Alert",
      content: message,
      callback: callback,
    });
  }

  closeDialog(id) {
    this.rootApp && this.rootApp.closeDialog(id);
  }

  throw(error, m) {
    const { title, content, message } =
      typeof error === "object"
        ? error
        : { title: error, content: m, message: m };
    this.dialog({
      type: "error",
      title: title,
      content: content || message,
      open: true,
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
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0; // Convierte a 32bit integer
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

  freeze(freeze = true) {
    this.rootApp?.freeze(freeze);
  }

  async method(Document, method, params = {}, options = {}) {
    const url = `/desk/method/${Document}/${method}`;
    params = typeof params === "string" ? { documentName: params } : params;
    return await http.post(url, params, { freeze: false, ...options });
  }

  async getMeta(Document, action, params = {}, options = {}) {
    if (!this.#loadedMeta[Document + action]) {
      this.#loadedMeta[Document + action] = await this.method(
        Document,
        action,
        params,
        options
      );
    }

    return this.#loadedMeta[Document + action];
  }

  require(src, callback, options = { async: true }) {
    const loadScript = (src, callback, options) => {
      return new Promise((resolve) => {
        window.loadScript(src, callback, options);
        resolve();
      });
    };

    if (Array.isArray(src)) {
      return Promise.all(src.map((s) => loadScript(s, callback, options)));
    } else {
      return loadScript(src, callback, options);
    }
    /*return new Promise(resolve => {
         window.loadScript(src, callback, options);
         resolve();
      });*/
    //this.scriptManager.loadScript(src, callback, options);
  }

  includeCSS(src, callback) {
    return new Promise((resolve) => {
      window.loadStylesheet(src).then(() => {
        //callback && callback();
        resolve();
      });

      /*this.scriptManager.loadStylesheet(src, () => {
            callback && callback();
            resolve();
         });*/
    });
    //this.scriptManager.loadStylesheet(src, callback);
  }

  #reserses = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
    up: "down",
    down: "up",
    in: "out",
    out: "in",
  };

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
      "zoom-out-right": "Zoom Out Right",
    };

    if (notContains) {
      return Object.keys(animations)
        .filter((a) => !a.includes(notContains))
        .reduce((obj, key) => {
          obj[key] = animations[key];
          return obj;
        }, {}); //.map(a => ({value: a, label: animations[a]}));
    }

    return animations;
  }

  reverseAnimation(animation) {
    return !animation
      ? null
      : animation
          .split("-")
          .map((a) => this.#reserses[a] || a)
          .join("-");
  }

  getAnimation(animation, notContains) {
    if (!animation) return null;
    if (animation === "random") {
      const transitions = Object.keys(this.animations(notContains)).filter(
        (animation) => animation !== "random"
      );
      return transitions[Math.floor(Math.random() * transitions.length)];
    } else {
      return animation;
    }
  }
}

const loopar = new Loopar();
export default loopar;
export { loopar, elementsDict };
