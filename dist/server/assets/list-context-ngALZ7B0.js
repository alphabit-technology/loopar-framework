var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx } from "react/jsx-runtime";
import { B as BaseDocument } from "./base-document-pXLepkHA.js";
import { l as loopar } from "../entry-server.js";
import { D as DeskGUI } from "./desk-gui-AmYxfFUP.js";
import { ListGrid } from "./form-table-Lbr47LtR.js";
import "./base-component-BnGRdg1n.js";
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
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./pagination-6me7nd6k.js";
import "lodash";
import "./form-1mb5BBtU.js";
import "zod";
import "./avatar-Q6YTls7t.js";
import "@radix-ui/react-avatar";
import "./card-Xssl5juf.js";
import "./checkbox-yqK5BTqw.js";
import "@radix-ui/react-checkbox";
import "./check-siG4PdgZ.js";
class ListContext extends BaseDocument {
  constructor(props) {
    super(props);
    __publicField(this, "hasHeader", true);
    __publicField(this, "hasSidebar", true);
    __publicField(this, "context", "index");
    __publicField(this, "renderStructure", false);
    this.state = {
      ...this.state,
      viewType: loopar.utils.cookie.get(this.props.meta.__DOCTYPE__.name + "_viewType") || this.props.meta.__DOCTYPE__.default_list_view || "List"
      //viewType: localStorage.getItem(props.__DOCTYPE__.name + "_viewType") || props.__DOCTYPE__.default_list_view || "List"
    };
  }
  get viewType() {
    return this.onlyGrid === true ? "Grid" : this.state.viewType;
  }
  render(content) {
    content = [
      content,
      !content || this.renderGrid ? /* @__PURE__ */ jsx(
        ListGrid,
        {
          meta: this.props.meta,
          viewType: this.viewType,
          docRef: this,
          ref: (grid) => {
            this.grid = grid;
          }
        }
      ) : null
      /*!content || this.renderGrid ? ListGrid({
         meta: this.props,
         viewType: this.viewType,
         docRef: this,
         ref: (grid) => {
            this.grid = grid;
         }
      }) : null*/
    ];
    return super.render(
      this.props.modal ? content : /* @__PURE__ */ jsx(
        DeskGUI,
        {
          docRef: this,
          children: content
        }
      )
    );
  }
  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }
}
export {
  ListContext as default
};
