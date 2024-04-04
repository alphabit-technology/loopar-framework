var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, Fragment } from "react/jsx-runtime";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import { l as loopar } from "../entry-server.js";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./form-field-WWLBJIO2.js";
import "./form-context-8n26Uc_0.js";
import "./form-z4zN6fsS.js";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
class MarkdownInput extends BaseInput {
  constructor() {
    super(...arguments);
    __publicField(this, "isWritable", true);
  }
  render() {
    this.data;
    return /* @__PURE__ */ jsx(Fragment, { children: " " });
  }
  componentDidMount1() {
    super.componentDidMount();
    loopar.includeCSS("/assets/plugins/simplemde/css/simplemde.min");
    loopar.require("/assets/plugins/simplemde/js/simplemde.min", () => {
      const data = this.data;
      this.input.addClass("d-none");
      this.css({ display: "block" });
      this.editor = new SimpleMDE({
        element: this.input.node,
        toolbar: [
          "bold",
          "italic",
          "heading",
          "|",
          "quote",
          "unordered-list",
          "ordered-list",
          "|",
          "link",
          "image",
          "|"
        ]
      });
      this.editor.value(data.value);
      this.editor.codemirror.on("change", () => {
        this.handleInputChange({ target: { value: this.editor.value() } });
      });
    });
  }
  val(value) {
    var _a, _b;
    if (!value) {
      return (_a = this.editor) == null ? void 0 : _a.value();
    } else {
      (_b = this.editor) == null ? void 0 : _b.value(value);
    }
  }
}
export {
  MarkdownInput as default
};
