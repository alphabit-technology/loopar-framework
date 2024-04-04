var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs } from "react/jsx-runtime";
import { C as Component, D as Droppable } from "./component-hNq1V6er.js";
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
class Col extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "dontHaveMetaElements", ["label", "text"]);
  }
  render(content = null) {
    return /* @__PURE__ */ jsxs(
      Droppable,
      {
        className: this.props.className,
        receiver: this,
        children: [
          this.props.children,
          content,
          this.elements
        ]
      }
    );
  }
  componentDidMount() {
    super.componentDidMount();
    this.props.designer && this.addClass("element draggable");
  }
  get metaFields() {
    const inputs = ["xm", "sm", "md", "lg", "xl"].map((size) => {
      return {
        element: INPUT,
        data: {
          name: size,
          label: `col-${size}`,
          format: "number",
          min: 1,
          max: 12
        }
      };
    });
    return [
      {
        group: "general",
        elements: inputs.reduce((acc, input) => {
          acc[input.data.name] = input;
          return acc;
        }, {})
      }
    ];
  }
}
export {
  Col as default
};
