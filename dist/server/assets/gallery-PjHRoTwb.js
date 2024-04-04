var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { B as BaseCarrusel } from "./base-carrusel-cSw1HFaJ.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import "react/jsx-runtime";
import "./preassembled-iMF5MVLE.js";
import "./component-hNq1V6er.js";
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
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "./chevron-left-fnrBQ1gk.js";
import "./chevron-right-1anJVGLe.js";
class Slider extends BaseCarrusel {
  constructor() {
    super(...arguments);
    //className = "slider";
    __publicField(this, "defaultElements", [
      {
        element: "image",
        data: {
          color_overlay: "rgba(0,0,0,0.3)",
          background_image: "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM",
          key: elementManage.uuid()
        }
      },
      {
        element: "image",
        data: {
          color_overlay: "rgba(0,0,0,0.3)",
          background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
          key: elementManage.uuid()
        }
      }
    ]);
  }
  addSlide() {
    const id = elementManage.uuid();
    const sliderCount = this.sliderCount();
    const newSlide = {
      element: "image",
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
  /*render() {
        const elementsDict = this.elementsDict || [];
        const forceParent = this.data.use_for_all_slides;
  
        return super.render([
           ...elementsDict.map((element, index) => {
              if (index != this.state.currentIndex) return null;
  
              const key = element.data.key;
              const data = {
                 //...(index > 0 ? { animation: forceParent? this.data.transition : element.data.animation || this.data.transition } : {}),
                 ...element.data,
                 animation: forceParent ? this.data.transition : element.data.animation || this.data.transition,
                 ...{
                    key: key,
                    //label: element.data.label || `Slide ${index + 1}`,
                 } 
              }
              return Image({
                 meta: {
                    data,
                    elements: element.elements,
                    //key: tabKey
                 },
                 //draggable: false,
                 key: key,
                 ...(this.props.docRef ? { docRef: this.props.docRef } : {}),
                 ...(this.props.designerRef ? { designerRef: this.props.designerRef } : {}),
                 ...(this.props.designer && {
                    hasTitle: true, designer: true
                 } || {}),
                 ref: tab => {
                    if (tab) {
                       if (this.props.designer) {
                          tab.parentComponent = this;
                       }
                       this["slider" + index] = tab;
                    }
                 }
              }, element.content)
           })
        ]);
     }*/
}
export {
  Slider as default
};
