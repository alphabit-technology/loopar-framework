var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import React__default from "react";
import { M as MetaComponentsLoader, A as AppSourceLoader, l as loopar } from "../entry-server.js";
import Dialog, { Prompt } from "./dialog-nmg_tOQf.js";
import { Toaster as Toaster$1, toast } from "sonner";
import { useTheme } from "next-themes";
import { u as useWorkspace, a as WorkspaceProvider } from "./workspace-provider-ZZuPyRcj.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./dialog-9N_htvR6.js";
import "@radix-ui/react-dialog";
import "./x-3j0F7ehT.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./input-LY3ihqM_.js";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
const Toaster = ({ ...props }) => {
  const { theme = "system" } = useTheme();
  return /* @__PURE__ */ jsx(
    Toaster$1,
    {
      theme,
      className: "lptoaster lpgroup",
      toastOptions: {
        classNames: {
          toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground"
        }
      },
      ...props
    }
  );
};
const Notifies = () => {
  const { theme } = useWorkspace();
  return /* @__PURE__ */ jsx(Toaster, { richColors: true, theme });
};
class Dialogs extends React__default.Component {
  constructor(props) {
    super(props);
    __publicField(this, "dialogs", {});
    this.state = {
      dialogs: props.dialogs || {},
      openDialog: false
    };
  }
  get openDialogs() {
    return Object.values(this.dialogs || {}).filter(
      (dialog) => dialog.state.open
    ).length;
  }
  render() {
    const state = this.state;
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      ...Object.values(state.dialogs || {}).map((dialog) => {
        dialog.ref = (ref) => this.dialogs[dialog.id] = ref;
        return dialog.type === "prompt" ? /* @__PURE__ */ jsx(Prompt, { ...dialog }) : /* @__PURE__ */ jsx(Dialog, { ...dialog });
      })
    ] });
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
const WorkspaceContext = ({ children, sidebarWidth, collapseSidebarWidth, headerHeight, __META__, menuItems }) => {
  return /* @__PURE__ */ jsx(
    WorkspaceProvider,
    {
      sidebarWidth,
      collapseSidebarWidth,
      workspace: __META__.W,
      headerHeight,
      menuItems,
      children
    }
  );
};
class BaseWorkspace extends React__default.Component {
  constructor(props) {
    super(props);
    __publicField(this, "apps", {});
    __publicField(this, "stateProgress", 0);
    __publicField(this, "increment", 1);
    __publicField(this, "notifies", {});
    this.state = {
      documents: props.documents || {},
      progress: 0,
      toProgress: 20,
      freeze: false,
      meta: props,
      notifies: {}
    };
  }
  /**
   * document: [{
   *    module: Component (imported),
   *    meta: Meta data of document,
   *    key: Unique key of document based on URL,
   * }]
   * #param res
   */
  setDocument(__META__) {
    const res = __META__ || {};
    const documents = this.state.documents || {};
    Object.values(documents).forEach((document) => {
      document.active = false;
    });
    res.meta.key = res.key;
    if (!documents[res.key]) {
      MetaComponentsLoader(__META__, this.props.environment).then(() => {
        AppSourceLoader(res.client_importer).then((module) => {
          documents[res.key] = {
            Module: module.default,
            meta: res.meta,
            active: true
          };
          this.setState({ documents }, () => {
            this.progress(102);
          });
        });
      });
    } else {
      documents[res.key] = {
        Module: documents[res.key].Module,
        meta: res.meta,
        active: true
      };
      this.setState({ documents }, () => {
        this.progress(102);
      });
    }
  }
  get documents() {
    this.mergeDocument();
    return /* @__PURE__ */ jsx(Fragment, { children: Object.values(this.state.documents).map((document) => {
      const { Module, meta } = document;
      return document.active ? /* @__PURE__ */ jsx(Module, { meta }, meta.key) : null;
    }) });
  }
  componentDidUpdate() {
    var _a;
    const documents = this.state.documents || {};
    const activeDocument = Object.values(documents).find(
      (document) => document.active
    );
    const meta = activeDocument == null ? void 0 : activeDocument.meta;
    const doctype = meta == null ? void 0 : meta.__DOCTYPE__;
    if (!doctype)
      return;
    const action = ["update", "create"].includes(meta.action) ? "form" : meta.action;
    const resources = (((_a = doctype == null ? void 0 : doctype.resources) == null ? void 0 : _a.rows) || []).filter(
      (resource) => resource.apply_on === "all" || resource.apply_on === action
    );
    if (resources.length && this.state.resourcesLoaded !== doctype.id) {
      const arrayResources = Object.values(resources).map((resource) => {
        if (resource.type === "CSS") {
          return loopar.includeCSS(resource.path);
        } else if (resource.type === "JS") {
          return loopar.require(resource.path);
        }
      });
      Promise.all(arrayResources).then(() => {
        this.setState({ resourcesLoaded: doctype.id });
      });
    }
  }
  componentDidMount() {
    loopar.rootApp = this;
  }
  mergeDocument() {
    const updateValue = (structure, document) => {
      return structure.map((el) => {
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
    };
    const documents = this.state.documents || {};
    Object.values(documents).forEach((document) => {
      if (document.meta.__DOCTYPE__ && document.meta.__DOCUMENT__) {
        document.meta.__DOCTYPE__.STRUCTURE = updateValue(
          JSON.parse(document.meta.__DOCTYPE__.doc_structure),
          document.meta.__DOCUMENT__
        );
      }
    });
  }
  updateDocument(key, document, hydrate = true, callback) {
    this.state.documents[key] && (this.state.documents[key].meta.__DOCUMENT__ = document);
  }
  render(content) {
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(
      WorkspaceContext,
      {
        __META__: this.props.__META__,
        sidebarWidth: this.sidebarWidth ?? 250,
        collapseSidebarWidth: this.collapseSidebarWidth ?? 0,
        headerHeight: this.headerHeight ?? 55,
        menuItems: this.menuItems(),
        children: [
          this.pace,
          /* @__PURE__ */ jsx(Dialogs, { ref: (dialogs) => this.dialogs = dialogs }),
          content,
          /* @__PURE__ */ jsx(Notifies, {})
        ]
      }
    ) });
  }
  setNotify({ title, message, type = "info", timeout = 5e3 }) {
    if (this.notifies[message])
      return;
    this.notifies[message] = true;
    setTimeout(() => {
      delete this.notifies[message];
    }, timeout);
    (toast[type] || toast)(title || loopar.utils.Capitalize(type), {
      description: message,
      duration: timeout,
      theme: "light"
    });
  }
  setCountDialogs(count) {
    this.dialogs.setCountDialogs(count);
  }
  emit(event, data) {
  }
  get pace() {
    const progress = this.state.progress;
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: `pace pace-${progress === 0 || progress > 100 ? "active" : "active"}`,
        ref: (progress2) => this.progressBarr = progress2,
        style: { bottom: 0, display: "block" },
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "pace-progress",
            "data-progress-text": `${this.state.progress}%`,
            "data-progress": this.state.progress,
            style: {
              transform: `translate3d(${this.state.progress}%, 0px, 0px)`,
              top: this.headerHeight || 55
            },
            children: /* @__PURE__ */ jsx("div", { className: "pace-progress-inner" })
          }
        )
      }
    );
  }
  progress(to) {
    var _a;
    let progress = this.stateProgress + this.increment * 0.1;
    this.increment += 1;
    if (progress >= 101) {
      progress = 0;
      this.stateProgress = 0;
      this.increment = 1;
    } else
      this.stateProgress = progress;
    const node = (_a = this.progressBarr) == null ? void 0 : _a.node;
    if (node) {
      node.setAttribute("data-progress", progress);
      node.setAttribute("data-progress-text", `${progress}%`);
      const progress_inner = node.querySelector(".pace-progress");
      progress_inner.style.transform = `translate3d(${progress}%, 0px, 0px)`;
      node.classList[progress > 0 ? "remove" : "add"]("pace-inactive");
      node.classList[progress > 0 ? "add" : "remove"]("pace-active");
    }
    progress < to && progress > 0 && setTimeout(() => this.progress(to), 0);
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
  get meta() {
    return this.state.meta || this.props.meta || {};
  }
  navigate(url) {
    loopar.navigate(url);
    loopar.currentPageName = url;
    this.setState({});
  }
}
export {
  BaseWorkspace as default
};
