var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx } from "react/jsx-runtime";
import { B as BaseText } from "./base-text-8uNKC1JS.js";
import "./component-hNq1V6er.js";
import "../entry-server.js";
import "react";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
class Paragraph extends BaseText {
  constructor() {
    super(...arguments);
    __publicField(this, "droppable", false);
    __publicField(this, "draggable", true);
    __publicField(this, "tagName", "p");
  }
  render() {
    if (this.props.designer) {
      this.tagName = "div";
      this.style = {
        ...this.style,
        //width: "200px",
        maxHeight: "6em",
        overflow: "auto",
        display: "-webkit-box",
        "-webkit-box-orient": "vertical"
      };
    }
    return /* @__PURE__ */ jsx("blockquote", { className: "text-pretty mt-6 text-slate-700 dark:text-slate-300", children: /* @__PURE__ */ jsx("p", { className: "mb-4 text-lg ", children: this.getText() }) });
  }
}
export {
  Paragraph as default
};
