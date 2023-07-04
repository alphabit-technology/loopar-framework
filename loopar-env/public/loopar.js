import Router from '/router/router.js';
import {UiManage} from "./components/uui.js";
import { http } from "/router/http.js";

class Loopar extends Router {
   ui = new UiManage();
   current_page_name = "";
   root_app = null;
   workspace = WORKSPACE || "";
   #colors= JSON.parse(localStorage.getItem('colors') || "{}");
   base_colors = ['pink', 'purple', 'indigo', 'blue', 'cyan', 'teal', 'green', 'orange', 'red']
   sidebar_option = "preview";
   constructor() {
      super();
   }

   dialog(dialog) {
      const content = dialog.content || dialog.message;
      dialog.id ??= typeof content === "string" ? dialog.content : dialog.title;
      dialog.open = dialog.open !== false;
      this.root_app && this.root_app.setDialog(dialog);

      return new Promise(resolve => {
         setTimeout(() => {
            resolve(this.root_app.dialogs.dialogs[dialog.id]);
         }, 0);
      });
   }

   prompt(dialog) {
      //const content = dialog.content || dialog.message;
      dialog.id = dialog.title;
      dialog.open = true;
      dialog.type = "prompt";
      this.root_app && this.root_app.setDialog(dialog);

      return new Promise(resolve => {
         setTimeout(() => {
            resolve(this.root_app.dialogs.dialogs[dialog.id]);
         }, 0);
      });
   }

   confirm(message, callback) {
      this.dialog({
         type: "confirm",
         title: "Confirm",
         content: message,
         callback: callback,
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
      this.root_app && this.root_app.closeDialog(id);
   }

   throw(error, m) {
      const { title, content, message } = typeof error === "object" ? error : { title: error, content: m, message: m };
      this.dialog({
         type: "error",
         title: title,
         content : content || message,
         open: true,
      });

      throw new Error(error.content || error.message || error);
   }

   notify(message, type = "success") {
      this.root_app && this.root_app.setNotify({message, type});
   }

   toggle_theme() {
      window.toggle_theme();

      this.root_app && this.root_app.setState({});
   }

   sidebar(){
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
      this.root_app && this.root_app.emit(event, data);
   }

   #random_color(name) {
      const color = this.base_colors[Math.floor(Math.random() *  this.base_colors.length)];
      const colors = this.colors;

      colors[name] ??= color;
      localStorage.setItem('colors', JSON.stringify(colors));

      return color;
   }


   get colors() {
      const colors = this.#colors;
      return typeof colors === "object" ? colors : {};
   }

   bg_color(name) {
      const colors = this.colors;
      return colors[name] || this.#random_color(name);
   }

   freeze(freeze = true) {
      this.root_app?.freeze(freeze);
   }

   async method(Document, method, params = {}) {
      const url = `/desk/method/${Document}/${method}`;
      return await http.post(url, params, {freeze: false});
   }
}

const loopar = new Loopar();
export {loopar};