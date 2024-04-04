import { jsx, jsxs } from "react/jsx-runtime";
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
class Section extends Component {
  render() {
    return /* @__PURE__ */ jsx("div", { className: "container", children: /* @__PURE__ */ jsx("section", { className: "mx-auto flex max-w-[1280px] flex-row gap-2 py-8 md:py-12 md:pb-8 lg:py-24 lg:pb-20", children: /* @__PURE__ */ jsxs(
      Droppable,
      {
        receiver: this,
        className: "flex-1",
        children: [
          this.props.children,
          this.elements
        ]
      }
    ) }) });
  }
}
export {
  Section as default
};
