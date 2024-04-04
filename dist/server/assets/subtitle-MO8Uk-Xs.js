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
class SubTitle extends BaseText {
  constructor() {
    super(...arguments);
    __publicField(this, "droppable", false);
    __publicField(this, "draggable", true);
  }
  render() {
    return super.render(
      /* @__PURE__ */ jsx(
        "h3",
        {
          className: `text-center ${this.getSize()} font-bold leading-tight tracking-tighter md:text-xl lg:leading-[1.1]`,
          ...this.props.designer ? {
            style: {
              maxHeight: "3em",
              overflow: "auto",
              display: "-webkit-box",
              "-webkit-line-clamp": 5,
              "-webkit-box-orient": "vertical"
            }
          } : {},
          children: this.getText()
        }
      )
    );
  }
}
export {
  SubTitle as default
};
