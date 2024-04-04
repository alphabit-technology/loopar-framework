var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { P as Preassembled } from "./preassembled-iMF5MVLE.js";
import "./element-manage-OWCB4Xyr.js";
import "../entry-server.js";
import "react";
import "react-dom/server";
import "react/jsx-runtime";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
class TextBlock extends Preassembled {
  constructor() {
    super(...arguments);
    __publicField(this, "droppable", true);
    __publicField(this, "defaultElements", [
      {
        element: "subtitle"
      },
      {
        element: "paragraph",
        data: {
          class: "text-muted font-size-lg mb-4",
          text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante."
        }
      }
    ]);
  }
}
export {
  TextBlock as default
};
