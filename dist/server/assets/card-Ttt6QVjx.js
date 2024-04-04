var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, Fragment, jsxs } from "react/jsx-runtime";
import { C as Component, D as Droppable } from "./component-hNq1V6er.js";
import { C as CardHeader, a as CardTitle, b as CardDescription, c as CardContent, d as CardFooter, e as Card$1 } from "./card-Xssl5juf.js";
import { c as cn } from "../entry-server.js";
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
class Card extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "dontHaveMetaElements", ["text"]);
    this.state = {
      ...this.state,
      collapsed: false,
      hover: false
    };
  }
  render() {
    const data = this.data;
    return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(CardHover, { children: [
      /* @__PURE__ */ jsxs(CardHeader, { children: [
        /* @__PURE__ */ jsx(CardTitle, { children: data.label }),
        /* @__PURE__ */ jsx(CardDescription, { children: data.description })
      ] }),
      /* @__PURE__ */ jsx(
        Droppable,
        {
          receiver: this,
          Component: CardContent,
          children: this.props.children || this.elements
        }
      ),
      /* @__PURE__ */ jsx(CardFooter, { className: "flex justify-between" })
    ] }) });
  }
  toggleHide() {
    this.setState({ collapsed: !this.state.collapsed });
  }
}
function CardHover(props) {
  return /* @__PURE__ */ jsx(
    Card$1,
    {
      className: cn(props.className, "hover:bg-card/50 transition-all hover:shadow-lg h-full"),
      children: props.children
    }
  );
}
export {
  CardHover as Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Card as default
};
