import { loopar } from "/loopar.js";
import { Dialog, Notify, div } from "/components/elements.js";
import { _Prompt } from "/components/common/dialog.js";
import Theme from "./theme.js";

class Dialogs extends React.Component {
   dialogs = {};
   constructor(props) {
      super(props);

      this.state = {
         dialogs: props.dialogs || {},
         openDialog: false,
         //open_dialogs: 0,
      };
   }

   get openDialogs() {
      return Object.values(this.dialogs || {}).filter(dialog => dialog.state.open).length;
   }

   render() {
      const state = this.state;
      return [
         Object.values(state.dialogs || {}).map(dialog => {
            dialog.ref = ref => this.dialogs[dialog.id] = ref;

            return dialog.type === "prompt" ? _Prompt({
               ...dialog
            }) : Dialog({
               ...dialog
            });
         })
      ]
   }

   setDialog(dialog) {
      const state = this.state;
      const currentDialogs = state.dialogs || {};
      currentDialogs[dialog.id] = dialog;

      this.setState({ dialogs: currentDialogs, openDialog: dialog.open }, () => {
         dialog.open && this.dialogs[dialog.id] && this.dialogs[dialog.id].show(dialog);
      });
   }

   closeDialog(id) {
      this.dialogs[id] && this.dialogs[id].close();
   }
}

export default class BaseWorkspace extends Theme {
   apps = {};
   stateProgress = 0;
   increment = 1;
   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         documents: props.documents || {},
         mobileMenuUser: false,
         showBackdrop: false,
         menu: false,
         collapseMenu: localStorage.getItem("collapseMenu") === "true",
         progress: 0,
         toProgress: 20,
         screenType: "desktop",
         openDropdowns: [],
         freeze: false,
         meta: props.meta,
      };

      this.onResize(this.resize.bind(this));
   }

   componentDidMount() {
      super.componentDidMount();
      loopar.rootApp = this;
   }

   /**
    * document: [{
    *    module: Component (imported),
    *    meta: Meta data of document,
    *    key: Unique key of document based on URL,
    * }]
    * @param res
    */
   setDocument(res) {
      const documents = this.state.documents || {};

      Object.values(documents).forEach(document => {
         document.active = false;
      });

      res.meta.key = res.key;

      if (!documents[res.key]) {
         import(res.client_importer).then(module => {
            documents[res.key] = {
               module: module,
               meta: res.meta,
               active: true,
            };

            this.setState({ documents }, () => {
               this.progress(102)
            });
         });
      } else {
         documents[res.key] = {
            module: documents[res.key].module,
            meta: res.meta,
            active: true,
         };

         this.setState({ documents }, () => {
            this.progress(102)
         });
      }
   }

   get documents() {
      this.mergeDocument();
      return Object.values(this.state.documents).map(document => {
         const { module, meta } = document;

         if (document.active) {
            return React.createElement(module.default, {
               meta,
               /*ref: doc => {
                 doc && document.meta?.__DOCUMENT__ && doc.loadData(document.meta.__DOCUMENT__);
               }*/
            });
         }
      });
   }

   mergeDocument() {
      const updateValue = (structure, document) => {
         return structure.map(el => {
            if (Object.keys(document).includes(el.data.name)) {
               const value = document[el.data.name];

               if (el.element === FORM_TABLE) {
                  if (value.rows) {
                     Object.assign(el, value);
                  } else {
                     el.rows = value;
                  }
               } else {
                  el.data.value = value;
               }
            }

            el.elements = updateValue(el.elements || [], document);
            return el;
         });
      }

      const documents = this.state.documents || {};
      Object.values(documents).forEach(document => {
         if (document.meta.__DOCTYPE__ && document.meta.__DOCTYPE__.STRUCTURE && document.meta.__DOCUMENT__) {
            updateValue(document.meta.__DOCTYPE__.STRUCTURE, document.meta.__DOCUMENT__);
         }
      });
   }

   updateDocument(key, document, hydrate = true) {
      this.state.documents[key] && (this.state.documents[key].meta.__DOCUMENT__ = document);
      //this.setState({documents: this.state.documents});
   }

   resize() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const state = this.state;
      const mobile = width < 768;
      const tablet = width < 992;
      const desktop = width >= 992;
      const mobileMenuUser = mobile && state.mobileMenuUser;
      const showBackdrop = mobile && state.showBackdrop;
      const menu = tablet && state.menu;
      const collapseMenu = tablet && state.collapseMenu;

      const screen_type = mobile ? "mobile" : tablet ? "tablet" : "desktop";

      //this.setState({width, height, mobile, tablet, desktop, mobileMenuUser, showBackdrop, menu, collapseMenu, screen_type});
   }

   render(content) {
      return [
         this.pace,
         React.createElement(Dialogs, {
            ref: dialogs => {
               if (dialogs) this.dialogs = dialogs
            },
         }),
         this.notifies,
         content,
         div({ className: `aside-backdrop ${this.state.freeze ? 'show' : ''}`, style: { display: this.state.freeze ? 'block' : 'none', backgroundColor: 'rgba(20,20,31,.4)', zIndex: 99 } })
      ]
   }

   get notifies() {
      const state = this.state;
      return div({
         className: "toast-bottom-left", id: "toast-container",
         style: { position: "fixed", bottom: "0px", left: "0px", right: "0px", zIndex: 999999 }
      }, [
         Object.values(state.notifies || {}).map(notify => {
            notify.ref = ref => this[notify.message] = ref;
            return Notify(notify);
         })
      ])
   }

   setNotify({ message, type = "info", timeout }) {
      const state = this.state;
      const currentNotifies = state.notifies || {};
      currentNotifies[message] = { message, type, timeout };

      this.setState({ notifies: currentNotifies });

      setTimeout(() => {
         this[message].show({ message, type, timeout });
      }, 0);
   }

   setCountDialogs(count) {
      this.dialogs.setCountDialogs(count);
   }

   emit(event, data) {
      /*Object.values(this.apps).forEach(app => {
         app.emit(event, data);
      });*/
   }

   onResize(fn) {
      window.addEventListener("resize", fn);
   }

   get pace() {
      const progress = this.state.progress;
      return [
         div({
            className: `pace pace-${progress === 0 || progress > 100 ? 'active' : 'active'}`,
            ref: progress => this.progressBarr = progress,
            style: { bottom: 0, display: "block" }
         }, [
            div({
               className: "pace-progress", "data-progress-text": `${this.state.progress}%`,
               "data-progress": this.state.progress,
               style: { transform: `translate3d(${this.state.progress}%, 0px, 0px)`, top: this.headerHeight || 55 }
            }, [
               div({ className: "pace-progress-inner" })
            ]),
            //div({className: "pace-activity"})
         ])
      ]
   }


   progress(to) {
      let progress = this.stateProgress + (this.increment * 0.1);
      this.increment += 1;

      if (progress >= 101) {
         progress = 0;
         this.stateProgress = 0;
         this.increment = 1;
      } else this.stateProgress = progress;

      const node = this.progressBarr?.node;

      if (node) {
         node.setAttribute("data-progress", progress);
         node.setAttribute("data-progress-text", `${progress}%`);

         const progress_inner = node.querySelector(".pace-progress");

         progress_inner.style.transform = `translate3d(${progress}%, 0px, 0px)`;
         node.classList[progress > 0 ? 'remove' : 'add']("pace-inactive");
         node.classList[progress > 0 ? 'add' : 'remove']("pace-active");
      }

      (progress < to && progress > 0) && setTimeout(() => this.progress(to), 0);
   }

   freeze(freeze = true) {
      this.setState({ freeze });
   }

   setDialog(dialog) {
      this.dialogs.setDialog(dialog);
   }

   closeDialog(id) {
      this.dialogs.closeDialog(id);
   }
}