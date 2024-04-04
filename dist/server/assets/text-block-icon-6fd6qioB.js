var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { C as Component } from "./component-hNq1V6er.js";
import { Card as CardHover } from "./card-Ttt6QVjx.js";
import { A as Avatar, a as AvatarFallback } from "./avatar-Q6YTls7t.js";
import { l as loopar } from "../entry-server.js";
import { C as CardHeader, b as CardDescription, c as CardContent } from "./card-Xssl5juf.js";
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
import "@radix-ui/react-avatar";
class BaseTextBlock extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "dontHaveMetaElements", []);
    __publicField(this, "defaultLabel", "Text block");
    __publicField(this, "defaultText", "I'm a awesome Text Block widget, you can customize in edit button in design mode.");
  }
  componentDidMount(prevProps, prevState, snapshot) {
    super.componentDidMount(prevProps, prevState, snapshot);
    const meta = this.props;
    setTimeout(() => {
      if (!meta.data.text) {
        this.props.designerRef.updateElement(meta.data.key, {
          label: this.defaultLabel,
          text: this.defaultText
        }, true);
      }
    }, 100);
  }
  getText() {
    return this.props.data.text || this.defaultText;
  }
}
class TextBlockIcon extends BaseTextBlock {
  constructor() {
    super(...arguments);
    __publicField(this, "droppable", false);
    __publicField(this, "className", "card shadow");
    __publicField(this, "dontHaveBackground", true);
  }
  render() {
    const data = this.props.data || {};
    const { label = "Text Block", text } = data;
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(CardHover, { children: [
      /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsxs(CardDescription, { className: "justify-left flex gap-3", children: [
        /* @__PURE__ */ jsx(Avatar, { className: `rounded-3 h-14 w-14 bg-slate-300 dark:bg-slate-800`, children: /* @__PURE__ */ jsx(AvatarFallback, { className: `bg-transparent text-2xl font-bold`, children: loopar.utils.avatar(label) }) }),
        /* @__PURE__ */ jsx("p", { children: /* @__PURE__ */ jsx("h4", { className: "text-2xl break-all", children: label }) })
      ] }) }),
      /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsx("h6", { className: "text-slate-500 dark:text-slate-400 text-pretty", children: text }) })
    ] }) });
  }
}
export {
  TextBlockIcon as default
};
