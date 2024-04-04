var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import { B as BaseCarrusel } from "./base-carrusel-cSw1HFaJ.js";
import "../entry-server.js";
import "react";
import "react-dom/server";
import "react/jsx-runtime";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./preassembled-iMF5MVLE.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./chevron-left-fnrBQ1gk.js";
import "./chevron-right-1anJVGLe.js";
class Carrusel extends BaseCarrusel {
  constructor() {
    super(...arguments);
    __publicField(this, "defaultElements", [
      {
        element: "banner",
        data: {
          text: "Slide 1",
          color_overlay: "rgba(0,0,0,0.3)",
          background_image: "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM",
          key: elementManage.uuid()
        }
      },
      {
        element: "banner",
        data: {
          text: "Slide 2",
          color_overlay: "rgba(0,0,0,0.3)",
          background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg"
        }
      }
    ]);
  }
  addSlide() {
    const id = elementManage.uuid();
    const sliderCount = this.sliderCount();
    const newSlide = {
      element: "banner",
      data: {
        key: `slider_${id}`,
        label: `Slide ${sliderCount + 1}`,
        background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
        color_overlay: "rgba(0,0,0,0.3)"
      }
    };
    this.setElements([newSlide], () => {
      this.showSlide(this.sliderCount() - 1);
    });
  }
}
export {
  Carrusel as default
};
