var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import { F as FormLabel, a as FormControl, b as FormDescription } from "./form-z4zN6fsS.js";
import { X } from "./x-3j0F7ehT.js";
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
class ColorPicker extends BaseInput {
  constructor() {
    super(...arguments);
    __publicField(this, "initialColor", {});
  }
  getColor(value) {
    if (value && typeof value === "string" && elementManage.isJSON(value)) {
      return JSON.parse(value);
    } else if (value && typeof value === "object") {
      return value;
    }
    return {
      color: "",
      alpha: 0.5
    };
  }
  render() {
    const handleOpenColorPicker = (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.selector.click();
    };
    const data = this.data;
    return this.renderInput((field) => {
      const rgbaSection = (color2, index) => parseInt(color2.slice(index, index + 2), 16);
      const { color, alpha } = this.getColor(field.value);
      const startLinearGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0)`;
      const endLinearGradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 1)`;
      const gradient = `rgba(${rgbaSection(color, 1)}, ${rgbaSection(color, 3)}, ${rgbaSection(color, 5)}, 0.3)`;
      const handleColorChange = (color2, alpha2) => {
        field.onChange(color2 ? JSON.stringify({ color: color2, alpha: alpha2 }) : "");
      };
      const key = `c${color}${alpha}`.replaceAll("#", "").replaceAll(".", "");
      return /* @__PURE__ */ jsxs("div", { className: "flex flex-col w-full", children: [
        /* @__PURE__ */ jsx(FormLabel, { className: "pb-3", children: data.label }),
        /* @__PURE__ */ jsx(FormControl, { children: /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsx("style", { children: `
                .${key} input[type="range"]::-webkit-slider-thumb,
                .${key} input[type="range"]::-moz-range-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 16px;
                  height: 16px;
                  background: #fff;
                  border-radius: 50%;
                  border: 1px solid #ccc;
                  box-shadow: 0 0 4px ${gradient};
                  cursor: pointer;
                  position: relative;
                  z-index: 2;
                }
                .${key} input[type="range"]::after {
                  position: absolute;
                  top: -20px;
                  left: 0;
                  right: 0;
                  text-align: center;
                  font-size: 12px;
                  color: #fff;
                }
                .${key} input[type="range"] {
                  background: linear-gradient(to right, ${startLinearGradient} 0%, ${endLinearGradient} 100%);
                  -webkit-appearance: none;
                }
              ` }),
          /* @__PURE__ */ jsxs("div", { className: `${key} flex flex-col align-items-center justify-center w-full h-[100px]`, children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "color",
                value: color,
                onChange: (e) => handleColorChange(e.target.value, alpha),
                ref: (selector) => this.selector = selector,
                className: "absolute w-0 h-0 overflow-hidden pointer-events-none opacity-0"
              }
            ),
            /* @__PURE__ */ jsxs(
              "div",
              {
                className: "w-full rounded-md border border-border shadow-sm inline-grid",
                children: [
                  /* @__PURE__ */ jsx(
                    "div",
                    {
                      onClick: handleOpenColorPicker,
                      style: {
                        backgroundColor: color,
                        opacity: alpha
                      },
                      className: "relative w-full h-20 cursor-pointer rounded-t-md"
                    }
                  ),
                  /* @__PURE__ */ jsxs("div", { className: "flex justify-between items-center", children: [
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        type: "range",
                        min: 0,
                        max: 1,
                        step: 0.01,
                        onChange: (e) => handleColorChange(color, e.target.value),
                        value: alpha,
                        style: { height: "30px" },
                        className: "rounded-bl-sm w-full h-[30px] outline-none cursor-pointer"
                      }
                    ),
                    /* @__PURE__ */ jsx(
                      "a",
                      {
                        style: { backgroundColor: endLinearGradient },
                        className: "cursor-pointer rounded-br-sm h-full w-8 flex items-center justify-center text-white",
                        onClick: () => {
                          handleColorChange("", 1);
                        },
                        children: /* @__PURE__ */ jsx(X, {})
                      }
                    )
                  ] })
                ]
              }
            )
          ] })
        ] }) }),
        data.description && /* @__PURE__ */ jsx(FormDescription, { children: data.description })
      ] });
    }, "flex flex-row gap-2");
  }
  /*componentDidMount() {
      super.componentDidMount();
  
      const value = this.data.value;
  
      if (value && typeof value === 'string' && elementManage.isJSON(value)) {
        const { color, alpha } = JSON.parse(value);
        this.setColor(color, alpha)
      }
    }*/
  /*handleColorChange = (e) => {
    const color = this.getColor();
    this.setColor(e.target.value, color.alpha);
  }*/
  /*handleAlphaChange = (e) => {
    const color = this.getColor();
    this.setColor(color.color, e.target.value);
  }*/
  /*setColor(color, alpha) {
    this.set("value", JSON.stringify({ color, alpha }), false);
  }*/
  /*resetColor() {
    this.setColor("", 1);
  }*/
  val() {
    const color = this.getColor();
    return {
      color: color.color,
      alpha: color.alpha
    };
  }
}
export {
  ColorPicker as default
};
