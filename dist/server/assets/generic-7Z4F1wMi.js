var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { C as Component } from "./component-hNq1V6er.js";
import { l as loopar } from "../entry-server.js";
import "react";
import "react/jsx-runtime";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
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
class Generic extends Component {
  constructor() {
    super(...arguments);
    //blockComponent = true;
    //dontHaveContainer = true;
    __publicField(this, "dontHaveMetaElements", ["label"]);
  }
  validateTag(tag) {
    const validTags = [
      "div",
      "span",
      "p",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "a",
      "i",
      "ul",
      "li",
      "img",
      "input",
      "button",
      "form",
      "label",
      "select",
      "option",
      "textarea",
      "table",
      "tr",
      "td",
      "th",
      "thead",
      "tbody",
      "tfoot",
      "nav",
      "header",
      "footer",
      "main",
      "section",
      "article",
      "aside",
      "blockquote",
      "br",
      "hr",
      "iframe",
      "map",
      "area",
      "audio",
      "video",
      "canvas",
      "datalist",
      "details",
      "embed",
      "fieldset",
      "figure",
      "figcaption",
      "mark",
      "meter",
      "object",
      "output",
      "progress",
      "q",
      "ruby",
      "rt",
      "rp",
      "samp",
      "script",
      "style",
      "summary",
      "time",
      "track",
      "var",
      "wbr"
    ];
    return validTags.includes(tag);
  }
  render(content) {
    const data = this.props.data;
    const tag = this.props.tag || data.tag;
    this.tagName = this.validateTag(tag) ? tag : "div";
    if (this.tagDontHaveChild(tag) && this.elementsDict.length > 0) {
      loopar.dialog({
        title: "Warning",
        message: `This element have a child element, but the tag "${this.tagName}" don't have child elements. will be used the tag "div" instead.`,
        buttons: [
          {
            label: "Ok",
            className: "btn btn-primary",
            onClick: () => {
              loopar.closeDialog();
            }
          }
        ]
      });
      this.tagName = "div";
    }
    return super.render(
      this.elementsDict.length === 0 ? this.props.children : ""
    );
  }
  get metaFields() {
    return [
      {
        group: "HTML",
        elements: {
          tag: { element: INPUT }
        }
      }
    ];
  }
}
export {
  Generic as default
};
