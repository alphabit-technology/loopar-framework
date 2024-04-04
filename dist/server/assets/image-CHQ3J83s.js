var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import DivComponent from "./div-rCeXGfsc.js";
import { C as Component } from "./component-hNq1V6er.js";
import { l as loopar } from "../entry-server.js";
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
class Image extends Component {
  //className = "image";
  //insideBackGround = true;
  //dontHaveContainer = true;
  //dontHaveBackground = true;
  constructor(props) {
    super(props);
    __publicField(this, "style", {
      //position: "relative",
      //width: "100%",
      top: 0,
      //, left: 0, right: 0, bottom: 0,
      //backgroundColor: "var(--secondary)",
      paddingTop: "60%",
      position: "relative"
      //overflow: "hidden"
    });
    this.state = {
      ...this.state,
      src: null
    };
  }
  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);
    if (prevProps.data.background_image !== this.props.data.background_image) {
      this.setState({
        src: this.getSrc() || "/uploads/empty-image.svg"
      });
    }
  }
  render() {
    var _a;
    const data = ((_a = this.props) == null ? void 0 : _a.data) || {};
    const color = loopar.utils.rgba(data.color_overlay);
    const aspect_ratio = data.aspect_ratio || "4:3";
    this.style = {
      ...this.style,
      paddingTop: loopar.utils.aspectRatio(aspect_ratio) + "%",
      backgroundColor: color
    };
    return super.render(
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          "img",
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: data.background_size || "cover",
              borderRadius: "0.25rem"
            },
            ...this.backGround(true)
          }
        ),
        /* @__PURE__ */ jsx(
          DivComponent,
          {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              height: "100%",
              objectFit: data.background_size || "cover",
              borderRadius: "0.25rem"
            },
            ...this.backGround(true)
          }
        )
      ] })
    );
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);
  }
  get metaFields() {
    return [
      {
        group: "custom",
        elements: {
          aspect_ratio: {
            element: SELECT,
            data: {
              options: [
                { option: "1:1", value: "1:1" },
                { option: "4:3", value: "4:3" },
                { option: "16:9", value: "16:9" },
                { option: "21:9", value: "21:9" },
                { option: "3:4", value: "3:4" },
                { option: "9:16", value: "9:16" },
                { option: "9:21", value: "9:21" }
              ]
            }
          }
        }
      }
    ];
  }
}
export {
  Image as default
};
