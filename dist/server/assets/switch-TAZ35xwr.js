var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs } from "react/jsx-runtime";
import { D as DefaultCheckbox } from "./default-checkbox-HPeugjQp.js";
import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { c as cn } from "../entry-server.js";
import "./base-component-BnGRdg1n.js";
import "clsx";
import "./form-context-8n26Uc_0.js";
import { a as FormControl, F as FormLabel, b as FormDescription } from "./form-z4zN6fsS.js";
import "./base-input-uYDrqEOF.js";
import "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "react-dom/server";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./form-field-WWLBJIO2.js";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "@radix-ui/react-separator";
import "react-hook-form";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
const Switch = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  SwitchPrimitives.Root,
  {
    className: cn(
      "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
      className
    ),
    ...props,
    ref,
    children: /* @__PURE__ */ jsx(
      SwitchPrimitives.Thumb,
      {
        className: cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )
      }
    )
  }
));
Switch.displayName = SwitchPrimitives.Root.displayName;
class SwitchClass extends DefaultCheckbox {
  constructor() {
    super(...arguments);
    __publicField(this, "dontHaveContainer", true);
  }
  render() {
    const data = this.data;
    return this.renderInput((field) => /* @__PURE__ */ jsxs("div", { className: "gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
        /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsx(
          Switch,
          {
            onCheckedChange: field.onChange,
            checked: field.value
          }
        ) }),
        /* @__PURE__ */ jsx(FormLabel, { className: "pl-2", children: data.label })
      ] }),
      data.description && /* @__PURE__ */ jsx(FormDescription, { children: data.description })
    ] }), "flex flex-row gap-2");
  }
}
export {
  SwitchClass as default
};
