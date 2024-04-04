import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import { F as FormLabel, a as FormControl, b as FormDescription, d as FormMessage } from "./form-z4zN6fsS.js";
import { T as Textarea } from "./textarea-lrGfzAVc.js";
import "./div-rCeXGfsc.js";
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
import "./form-field-WWLBJIO2.js";
import "./form-context-8n26Uc_0.js";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
class TextArea extends BaseInput {
  render() {
    const data = this.data;
    const type = this.props.type || data.type || "input";
    return this.renderInput((field) => /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(FormLabel, { children: data.label }),
      /* @__PURE__ */ jsx(FormControl, { className: "p-2", children: /* @__PURE__ */ jsx(
        Textarea,
        {
          ...data,
          placeholder: data.placeholder || data.label,
          type,
          ...field,
          className: "bg-transparent border border-input rounded-sm"
        }
      ) }),
      /* @__PURE__ */ jsx(FormDescription, { children: data.description }),
      /* @__PURE__ */ jsx(FormMessage, {})
    ] }));
  }
}
export {
  TextArea as default
};
