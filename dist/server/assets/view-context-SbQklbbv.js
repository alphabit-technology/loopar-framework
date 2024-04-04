var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { B as BaseDocument } from "./base-document-pXLepkHA.js";
import { a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import { D as DeskGUI } from "./desk-gui-AmYxfFUP.js";
import "../entry-server.js";
import "react";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./element-manage-OWCB4Xyr.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./link-w8K-UYiW.js";
import "./chevron-right-1anJVGLe.js";
import "./form-z4zN6fsS.js";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "./form-context-8n26Uc_0.js";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "./plus-kMrZWx_A.js";
import "./menu-VqBr40u5.js";
import "./x-3j0F7ehT.js";
class View extends BaseDocument {
  constructor(props) {
    super(props);
    __publicField(this, "hasSidebar", true);
    __publicField(this, "hasHeader", true);
    __publicField(this, "hasHistory", true);
  }
  render(content) {
    const meta = this.props.meta;
    meta.__DOCTYPE__;
    console.log(["STRUCTURE", meta]);
    return super.render(
      /* @__PURE__ */ jsx(
        DeskGUI,
        {
          docRef: this,
          children: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(DynamicComponent, { elements: JSON.parse(meta.__DOCTYPE__.doc_structure), parent: this }),
            content
          ] })
        }
      )
      /*DeskGUI({
         docRef: this
      }, [
         ...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element, {
               meta: {
                  ...el,
               },
            })
         }),
         content
      ])*/
    );
  }
}
export {
  View as default
};
