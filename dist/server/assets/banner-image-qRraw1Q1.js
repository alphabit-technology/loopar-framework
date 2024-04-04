var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, Fragment } from "react/jsx-runtime";
import { P as Preassembled } from "./preassembled-iMF5MVLE.js";
import "./element-manage-OWCB4Xyr.js";
import "../entry-server.js";
import "react";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
class BannerImage extends Preassembled {
  constructor() {
    super(...arguments);
    __publicField(this, "blockComponent", true);
    __publicField(this, "className", "py-5 h-100");
    __publicField(this, "defaultDescription", "This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.");
    /*style = {
        height: "80vh"
     };*/
    __publicField(this, "defaultElements", [
      {
        element: "div",
        data: {
          class: "col-12 col-md-6 order-md-2"
        },
        elements: [
          {
            element: "image",
            data: {
              class: "img-fluid mb-5 mb-md-0",
              src: "https://picsum.photos/800/600",
              alt: ""
            }
          }
        ]
      },
      {
        element: "div",
        data: {
          class: "col-12 col-md-6 order-md-1"
        },
        elements: [
          {
            element: "div",
            data: {
              class: "col-fix pl-xl-3 ml-auto text-center text-sm-left"
            },
            elements: [
              {
                element: "generic",
                data: {
                  tag: "h2",
                  class: "display-4 enable-responsive-font-size mb-4",
                  text: "Jumbo heading"
                }
              },
              {
                element: "generic",
                data: {
                  tag: "p",
                  class: "lead text-muted mb-5",
                  text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante."
                }
              },
              {
                element: "button",
                data: {
                  class: "btn btn-lg btn-primary d-block d-sm-inline-block mr-sm-2 my-3",
                  label: "Let's Try ",
                  elements: [
                    {
                      element: "i",
                      data: {
                        class: "fa fa-angle-right ml-2"
                      }
                    }
                  ]
                }
              },
              {
                element: "button",
                data: {
                  class: "btn btn-lg btn-subtle-primary d-block d-sm-inline-block my-3",
                  target: "_blank",
                  label: "Documentation"
                }
              }
            ]
          }
        ]
      }
    ]);
  }
  render() {
    return /* @__PURE__ */ jsx(Fragment, {});
  }
  get metaFields() {
    return [
      {
        group: "general",
        elements: {
          full_height: {
            element: SWITCH,
            data: {
              description: "If enabled the slider will have the height of the screen."
            }
          }
        }
      }
    ];
  }
}
export {
  BannerImage as default
};
