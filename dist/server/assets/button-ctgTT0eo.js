var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import DivComponent from "./div-rCeXGfsc.js";
import "./component-hNq1V6er.js";
import "react/jsx-runtime";
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
const buttons = {
  link: "link",
  info: "info",
  default: "default",
  primary: "primary",
  secondary: "secondary",
  success: "success"
};
class Button extends DivComponent {
  constructor() {
    super(...arguments);
    __publicField(this, "className", "btn");
    __publicField(this, "droppable", false);
  }
  get tagName() {
    return !this.props.designer ? "div" : "button";
  }
  render() {
    const data = this.data;
    if (this.className) {
      this.className = this.className.replace(/btn-[^ ]*/, "");
    }
    this.className += ` ${data.class || ""} btn btn-${buttons[data.type || "primary"]} ${data.size ? `btn-${data.size}` : ""}`;
    return super.render(data.label || "Button");
  }
  /*make() {
        super.make();
        const data = this.data;
  
        this.addClass(`${data.class || ''} btn ${buttons[data.type || 'primary']} ${data.size ? `btn-${data.size}` : ''}`);
     }*/
  /*make() {
        const label = this.content ? this.content.label || null : null;
        this.data.label = this.data.label || "Button";
  
        if (!label) {
           object_manage.assign(this, {
              content: {
                 label: elements({content: this.data.label}).tag('span')
              }
           });
        }
  
        if (this.designer) {
           this.hasTitle = false;
           super.tag('div');
        } else {
           super.tag('a');
        }
  
        this.addClass('btn');
     }*/
  setType(type = "default") {
  }
  setSize(size = "md") {
  }
  get metaFields() {
    return {
      group: "form",
      elements: {
        action: {
          element: INPUT,
          data: {
            description: "if you define url, button will be link; if you define simple action like save, print..., button will be call action function in your view"
          }
        }
      }
    };
  }
}
Object.keys(buttons).forEach((button) => {
  Object.defineProperties(Button.prototype, {
    [button]: {
      value: function(props) {
        return this.setType(button);
      }
    }
  });
});
export {
  Button as default
};
