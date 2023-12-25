import Router from '#tools/router/router';
import GuiManage from "#tools/gui";
import http from "#tools/router/http";
import * as Helpers from "#global/helper";
import scriptManager from '#tools/script-manager';

class Loopar extends Router {
   ui = GuiManage;
   scriptManager = scriptManager;
   currentPageName = "";
   rootApp = null;
   #colors = ""//JSON.parse(localStorage.getItem('colors') || "{}");
   baseColors = 'red,blue,green,yellow,orange,purple,pink,teal,cyan,gray,gray-dark,primary,secondary,success,danger,warning,info,light,dark'.split(',');
   sidebarOption = "preview";
   Components = {};
   #loadedMeta = {};

   constructor() {
      super();
      this.utils = Helpers;
   }

   getComponent(component, pre = "./") {
      const cParse = component.replaceAll(/_/g, "-");
      return new Promise(resolve => {
         if (this.Components[component]) {
            resolve(this.Components[component]);
         } else {
            import(`./components/${cParse}.jsx`).then(c => {
               this.Components[component] = c;
               resolve(c);
            });
         }
      });
   }

   async loadComponents(components, callback) {
      const promises = Array.from(new Set(components)).map(c => this.getComponent(c));
      Promise.all(promises).then(callback);
   }

   dialog(dialog) {
      const content = dialog.content || dialog.message;
      dialog.id ??= typeof content === "string" ? dialog.content : dialog.title;
      dialog.open = dialog.open !== false;
      this.rootApp && this.rootApp.setDialog(dialog);

      return new Promise(resolve => {
         setTimeout(() => {
            resolve(this.rootApp.dialogs.dialogs[dialog.id]);
         }, 0);
      });
   }

   prompt(dialog) {
      //const content = dialog.content || dialog.message;
      dialog.id = dialog.title;
      dialog.open = true;
      dialog.type = "prompt";
      this.rootApp && this.rootApp.setDialog(dialog);

      return new Promise(resolve => {
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
      const { title, content, message } = typeof error === "object" ? error : { title: error, content: m, message: m };
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
      return new Promise(resolve => {
         document.ready(() => {
            resolve();
         });
      });
   }

   emit(event, data) {
      this.rootApp && this.rootApp.emit(event, data);
   }

   #randomColor(name) {
      const color = this.baseColors[Math.floor(Math.random() * this.baseColors.length)];
      const colors = this.colors;

      colors[name] ??= color;
      localStorage.setItem('colors', JSON.stringify(colors));

      return color;
   }


   get colors() {
      const colors = this.#colors;
      return typeof colors === "object" ? colors : {};
   }

   bgColor(name) {
      const colors = this.colors;
      return colors[name] || this.#randomColor(name);
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
         this.#loadedMeta[Document + action] = await this.method(Document, action, params, options);
      }

      return this.#loadedMeta[Document + action];
   }

   require(src, callback, options = { async: true }) {
      const loadScript = (src, callback, options) => {
         return new Promise(resolve => {
            window.loadScript(src, callback, options);
            resolve();
         }
         )
      }

      if (Array.isArray(src)) {
         return Promise.all(src.map(s => loadScript(s, callback, options)));
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
      return new Promise(resolve => {
         resolve(window.loadStylesheet(src, { callback }));
         /*this.scriptManager.loadStylesheet(src, () => {
            callback && callback();
            resolve();
         });*/
      });
      //this.scriptManager.loadStylesheet(src, callback);
   }

   #reserses = {
      "top": "bottom",
      "bottom": "top",
      "left": "right",
      "right": "left",
      "up": "down",
      "down": "up",
      "in": "out",
      "out": "in",
   }

   animations(notContains) {
      const animations = {
         "random": "Random",
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
      }

      if (notContains) {
         return Object.keys(animations).filter(a => !a.includes(notContains)).reduce(
            (obj, key) => {
               obj[key] = animations[key];
               return obj;
            },
            {}
         );   //.map(a => ({value: a, label: animations[a]}));
      }

      return animations;
   }

   reverseAnimation(animation) {
      return !animation ? null : animation.split("-").map(a => this.#reserses[a] || a).join("-");
   }

   getAnimation(animation, notContains) {
      if (!animation) return null;
      if (animation === "random") {
         const transitions = Object.keys(this.animations(notContains)).filter(animation => animation !== "random");
         return transitions[Math.floor(Math.random() * transitions.length)];
      } else {
         return animation;
      }
   }
}

export default new Loopar();