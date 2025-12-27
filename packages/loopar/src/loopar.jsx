import Router from "@@tools/router/router";
import * as Helpers from "@global/helper";
import * as dateUtils from "@global/date-utils";
import scriptManager from "@@tools/script-manager";
import { elementsDict, AIPrompt } from "@global/element-definition";
import Emitter from '@services/emitter/emitter';

class Loopar extends Router {
  scriptManager = scriptManager;
  currentPageName = "";
  rootApp = null;
  sidebarOption = "preview";
  Components = {};
  #loadedMeta = {};
  generatedColors = {};
  iconsCache={}

  constructor() {
    super();
    this.utils = Helpers;
    this.cookie = Helpers.cookie;
    this.dateUtils = dateUtils;
  }

  dialog(dialog) {
    const content = dialog.content || dialog.message;
    dialog.id ??= typeof content === "string" ? dialog.content : dialog.title;
    dialog.open = dialog.open !== false;
    this.emit('dialog', dialog);
  }

  prompt(dialog) {
    dialog.id = "test-dialog"// dialog.title;
    dialog.open = true;
    dialog.type = "prompt";
    dialog.content = <></>
    this.emit('dialog', dialog);
  }

  confirm(message, callback) {
    this.emit('dialog', {
      type: "confirm",
      title: "Confirm",
      content: message,
      ok: callback,
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

  reload() {
    console.log("Reloading...");
    this.navigate(window.location.href);
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
    const { type, title, content, message, description, status } = typeof error === "object" ? error
        : { title: "Error", content: error, message: m };

    this.emit('dialog', {
      type: type || "error",
      title: title,
      content: content || message || description || status,
    });
    
    if(throwError){
      throw new Error(message || description || status);
    }else{
      console.error("LOOPAR: uncaughtException", message || description || status);
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

  refresh() {
    this.emit('refresh');
  }

  freeze(freeze = true) {
    Emitter.emit('freeze', freeze);
  }

  method(Document, method, params = {}, options = {}) {
    const curUrl = window.location.href;
    const curParams = new URLSearchParams(curUrl.split('?')[1]);

    const curParamsObject = {};
    curParams.forEach((value, key) => {
      curParamsObject[key] = value;
    });

    const url = `/desk/${Document}/${method}`;
    params = typeof params === "string" ? { name: params } : params;
    
    return this.post(url, {...params, ...curParamsObject }, { freeze: true, ...options });
  }

  async getMeta(Document, action, params = {}) {
    if (!this.#loadedMeta[Document + action]) {
      const loadMeta = async () => {
        return new Promise((resolve) => {
          this.method(Document, action, params, {
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

  #reverses = {
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
    const animations ={
      "fade-up": {
        initial: "opacity-0 translate-y-10",
        visible: "opacity-100 translate-y-0",
      },
      "fade-down": {
        initial: "opacity-0 -translate-y-10",
        visible: "opacity-100 translate-y-0",
      },
      "fade-left": {
        initial: "opacity-0 translate-x-10",
        visible: "opacity-100 translate-x-0",
      },
      "fade-right": {
        initial: "opacity-0 -translate-x-10",
        visible: "opacity-100 translate-x-0",
      },
      "slide-up": {
        initial: "translate-y-10",
        visible: "translate-y-0",
      },
      "slide-down": {
        initial: "-translate-y-10",
        visible: "translate-y-0",
      },
      "slide-left": {
        initial: "translate-x-10",
        visible: "translate-x-0",
      },
      "slide-right": {
        initial: "-translate-x-10",
        visible: "translate-x-0",
      },
      "zoom-in": {
        initial: "scale-90 opacity-0",
        visible: "scale-100 opacity-100",
      },
      "zoom-out": {
        initial: "scale-110 opacity-0",
        visible: "scale-100 opacity-100",
      },
      "flip-up": {
        initial: "opacity-0 rotateX-90",
        visible: "opacity-100 rotateX-0",
      },
      "flip-down": {
        initial: "opacity-0 rotateX--90",
        visible: "opacity-100 rotateX-0",
      },
    }

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
          .map((a) => this.#reverses[a] || a)
          .join("-");
  }

  getAnimation(animation, notContains) {
    if (!animation) return null;
    if (animation === "random") {
      const transitions = Object.keys(this.animations(notContains)).filter(
        (animation) => animation !== "random"
      );
      return this.animations()[transitions[Math.floor(Math.random() * transitions.length)]]
    } else {
      return this.animations()[animation];
    }
  }
}

const loopar = new Loopar();
export default loopar;
export { loopar, elementsDict, AIPrompt };