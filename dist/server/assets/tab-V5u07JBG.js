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
class Tab extends Component {
  remove() {
    this.props.parentElement.removeTab(this.props.data.key);
  }
  setData(data) {
    super.setData(data);
    this.props.parentComponent.updateTab(this.props.data.key, data);
  }
  render() {
    return /* @__PURE__ */ jsxs(
      Droppable,
      {
        receiver: this,
        children: [
          this.props.children,
          this.elements
        ]
      }
    );
  }
}
export {
  Tab as default
};
