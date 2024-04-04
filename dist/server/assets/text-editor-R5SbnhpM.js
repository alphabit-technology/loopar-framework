var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx } from "react/jsx-runtime";
import { l as loopar } from "../entry-server.js";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import "react";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./form-field-WWLBJIO2.js";
import "./form-context-8n26Uc_0.js";
import "./form-z4zN6fsS.js";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
class TextEditor extends BaseInput {
  constructor() {
    super(...arguments);
    __publicField(this, "toolbarOptions", [
      ["bold", "italic", "underline", "strike"],
      // toggled buttons
      ["blockquote", "code-block"],
      [{ header: 1 }, { header: 2 }],
      // custom button values
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      // superscript/subscript
      [{ indent: "-1" }, { indent: "+1" }],
      // outdent/indent
      [{ direction: "rtl" }],
      // text direction
      [{ size: ["small", false, "large", "huge"] }],
      // custom dropdown
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ color: [] }, { background: [] }],
      // dropdown with defaults from theme
      [{ font: [] }],
      [{ align: [] }],
      ["clean"]
      // remove formatting button
    ]);
  }
  render() {
    return super.render(
      /* @__PURE__ */ jsx(
        "div",
        {
          className: "text-editor",
          ref: (editor_container) => this.editor_container = editor_container,
          style: { height: 300 }
        }
      )
    );
  }
  componentDidMount() {
    super.componentDidMount();
    loopar.scriptManager.loadStylesheet("/assets/plugins/quill/quill.snow");
    loopar.scriptManager.loadScript("/assets/plugins/quill/quill.min", () => {
      this.initEditor();
    });
  }
  initEditor() {
    this.input.addClass("d-none");
    this.label.addClass("d-none");
    this.editor = new Quill(this.editor_container.node, {
      modules: {
        toolbar: this.toolbarOptions
      },
      theme: "snow"
    });
    this.editor.on("text-change", (delta, oldDelta, source) => {
      this.handleInputChange({ target: { value: this.editor.getContents() } });
    });
    this.editor.setContents(JSON.parse(this.data.value || "{}"));
  }
  val(val = null) {
    if (val != null) {
      this.editor.setContents(JSON.parse(val || "{}"));
      this.trigger("change");
    } else {
      return JSON.stringify(this.editor.getContents());
    }
  }
}
export {
  TextEditor as default
};
