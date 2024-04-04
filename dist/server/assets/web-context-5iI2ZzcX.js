var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx } from "react/jsx-runtime";
import { B as BaseDocument } from "./base-document-pXLepkHA.js";
import { a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import { l as loopar } from "../entry-server.js";
import "react";
import "./element-manage-OWCB4Xyr.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
class WebContext extends BaseDocument {
  constructor(props) {
    super(props);
    __publicField(this, "handleBeforeUnload", () => {
      this.setScrollPosition();
    });
  }
  render(content = []) {
    return super.render([
      /* @__PURE__ */ jsx(DynamicComponent, { elements: JSON.parse(this.meta.__DOCTYPE__.doc_structure), parent: this }),
      /*...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
         if (el.data.hidden) return null;
         return Element(el.element, {
            docRef: this,
            meta: {
               ...el,
            },
         })
      }),*/
      content
    ]);
  }
  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }
  getPageKey() {
    return this.meta.key;
  }
  getCurrentScrollPosition() {
    return loopar.utils.cookie.get(this.getPageKey()) || window.scrollY || window.pageYOffset;
  }
  initScroll() {
    const scrollPosition = loopar.utils.cookie.get(this.getPageKey()) || 0;
    window.scrollTo(0, scrollPosition);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }
  setScrollPosition() {
    loopar.utils.cookie.set(this.getPageKey(), window.scrollY || window.pageYOffset);
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }
}
export {
  WebContext as default
};
