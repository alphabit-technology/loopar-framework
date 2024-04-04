var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var _a, _b;
import { jsx, jsxs } from "react/jsx-runtime";
import { P as Preassembled } from "./preassembled-iMF5MVLE.js";
import { D as Droppable } from "./component-hNq1V6er.js";
import "../entry-server.js";
import "react";
import "./base-component-BnGRdg1n.js";
import "./element-manage-OWCB4Xyr.js";
import "./file-manager-elzUYIBp.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
class Banner extends Preassembled {
  constructor() {
    super(...arguments);
    __publicField(this, "style", {
      //height: "100vh",
      width: "100%"
    });
    __publicField(this, "droppable", true);
    __publicField(this, "defaultElements", [
      {
        element: "title",
        data: {
          text: ((_a = this.data) == null ? void 0 : _a.label) || "Banner Title...",
          size: "3xl",
          text_align: "center"
        }
      },
      {
        element: "subtitle",
        data: {
          text: ((_b = this.data) == null ? void 0 : _b.text) || "Subtitle...",
          text_align: "center"
        }
      }
    ]);
  }
  get designerClasses() {
    return "h-full w-full p-3 py-6";
  }
  render() {
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "grid grid-cols-1 gap-4 place-content-center w-full h-full mask-image:linear-gradient(to bottom, white, white, transparent);-webkit-mask-image:linear-gradient(to bottom, white, white, transparent)",
        ...this.backGround(),
        children: /* @__PURE__ */ jsxs(Droppable, { receiver: this, children: [
          this.props.children,
          this.elements
        ] })
      }
    );
  }
}
export {
  Banner as default
};
