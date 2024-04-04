var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, jsx } from "react/jsx-runtime";
import { P as Preassembled } from "./preassembled-iMF5MVLE.js";
import { l as loopar } from "../entry-server.js";
import "react";
import { D as DesignerContext, a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import "clsx";
import { C as ChevronLeft } from "./chevron-left-fnrBQ1gk.js";
import { C as ChevronRight } from "./chevron-right-1anJVGLe.js";
class BaseCarrusel extends Preassembled {
  constructor(props) {
    super(props);
    __publicField(this, "nextSlide", () => {
      this.setState(
        (prevState) => ({
          prevIndex: prevState.currentIndex,
          currentIndex: this.getNextSlideIndex()
        }),
        () => {
          loopar.utils.cookie.set(this.props.data.key, this.state.currentIndex);
        }
      );
    });
    __publicField(this, "prevSlide", () => {
      this.setState(
        (prevState) => ({
          prevIndex: prevState.currentIndex,
          currentIndex: this.getPrevSlideIndex()
        }),
        () => {
          loopar.utils.cookie.set(this.props.data.key, this.state.currentIndex);
        }
      );
    });
    this.state = {
      ...this.state,
      currentIndex: loopar.utils.cookie.get(this.props.data.key) || 0,
      prevIndex: 0,
      focus: false,
      initialized: false
    };
  }
  getItemsRender() {
    const elementsDict = this.elementsDict || [];
    if (!elementsDict.length)
      return [];
    const { currentIndex, prevIndex } = this.state;
    const transition = this.getTransition();
    const items = [elementsDict[currentIndex]];
    !this.props.designer && items.unshift(elementsDict[prevIndex]);
    return /* @__PURE__ */ jsxs(
      "div",
      {
        className: "relative w-full h-full",
        children: [
          ...items.map((element, index) => {
            const key = element.data.key;
            const data = {
              test_name: index == 0 ? "test-name" : "",
              ...element.data,
              animation: index == 0 && !this.props.designer ? null : transition,
              static_content: this.data.static_content,
              delay: 300,
              background_color: this.data.color_overlay,
              color_overlay: this.data.color_overlay,
              key
            };
            return /* @__PURE__ */ jsx(
              "div",
              {
                className: "absolute w-full h-full",
                style: {
                  backgroundColor: loopar.utils.rgba(this.data.color_overlay)
                },
                children: /* @__PURE__ */ jsx(
                  DynamicComponent,
                  {
                    elements: [
                      {
                        ...element,
                        element: element.element || "banner",
                        className: !this.props.designer ? index == 0 ? "hide-time" : "show-time" : "",
                        data,
                        elements: element.elements,
                        key,
                        ref: (tab) => {
                          if (tab) {
                            if (this.props.designer) {
                              tab.parentComponent = this;
                            }
                            this["slider" + index] = tab;
                          }
                        }
                      }
                    ],
                    parent: this
                  },
                  key
                )
              }
            );
          })
        ]
      }
    );
  }
  render(content) {
    const data = this.props.data || {};
    const style = {};
    if (data.full_height) {
      style.height = "100vh";
    } else {
      style.paddingTop = "60%";
    }
    return /* @__PURE__ */ jsx(
      "div",
      {
        className: "relative w-full",
        style: {
          ...style,
          overflow: "hidden"
        },
        children: /* @__PURE__ */ jsxs(
          "div",
          {
            className: `align-items-center absolute w-full h-full`,
            style: {
              overflow: "hidden",
              top: 0
            },
            onMouseEnter: (e) => {
              e.preventDefault();
              this.setFocus(true, 100);
            },
            onMouseLeave: (e) => {
              e.preventDefault();
              this.setFocus(false, 300);
            },
            children: [
              this.getChevron("left", ChevronLeft),
              content || this.getItemsRender(),
              this.getChevron("right", ChevronRight)
            ]
          }
        )
      }
    );
  }
  getTransition() {
    return loopar.getAnimation(this.data.transition, "flip");
  }
  getItems() {
    return this.props.elements || [];
  }
  getNextSlideIndex() {
    return (this.state.currentIndex + 1) % this.getItems().length;
  }
  getPrevSlideIndex() {
    return (this.state.currentIndex - 1 + this.getItems().length) % this.getItems().length;
  }
  getCurrentSlide() {
    return this.getItems().find(
      (e, index) => index === this.state.currentIndex
    );
  }
  get elementsDict() {
    return this.context.designerMode ? super.elementsDict : this.props.children || super.elementsDict;
  }
  getChevron(position, Icon) {
    const _position = position === "left" ? "left-5" : "right-5";
    return /* @__PURE__ */ jsx(
      "button",
      {
        className: `hidden md:d-block lg:d-block z-10 md:inline-flex lg:inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-background/60 shadow-sm hover:bg-accent absolute rounded-full top-1/2 -translate-y-1/2 h-20 w-20 ${this.state.focus ? "" : ""} ${_position}`,
        onClick: (e) => {
          e.preventDefault();
          position === "left" ? this.prevSlide() : this.nextSlide();
          this.resetInterval();
        },
        children: /* @__PURE__ */ jsx(Icon, { className: "w-19 h-19" })
      }
    );
  }
  getIndicators() {
    return this.getSliders().map((e, index) => /* @__PURE__ */ jsx(
      "button",
      {
        className: "w3-button w3-white w3-display-bottommiddle",
        style: {
          zIndex: "99999999",
          padding: 20,
          margin: 20,
          ...this.state.initialized ? {} : { display: "none" }
        },
        onClick: (e2) => {
          e2.preventDefault();
          this.showSlide(index);
          this.resetInterval();
        },
        children: /* @__PURE__ */ jsx(
          "span",
          {
            className: "w3-xlarge w3-text-white w3-display-bottommiddle",
            style: {
              fontSize: "3rem",
              fontWeight: "bold",
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "auto",
              transform: "translate(-50%, -50%)"
            },
            children: /* @__PURE__ */ jsx("span", { className: "fa fa-circle" })
          }
        )
      }
    ));
  }
  getCounter() {
    return this.context.designerMode ? /* @__PURE__ */ jsxs(
      "div",
      {
        className: "position-absolute slider-index",
        style: {
          fontSize: "2rem",
          bottom: 0,
          left: 5,
          width: "calc(100% - 5px)"
        },
        children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              className: "btn btn-primary btn-floated position-absolute",
              onClick: (e) => {
                e.preventDefault();
                this.addSlide();
              },
              children: /* @__PURE__ */ jsx("span", { className: "fa fa-plus" })
            }
          ),
          /* @__PURE__ */ jsxs("span", { className: "badge badge-primary", children: [
            /* @__PURE__ */ jsx("span", { children: parseInt(this.state.currentIndex) + 1 }),
            /* @__PURE__ */ jsx("span", { className: "text-muted", children: "/" }),
            /* @__PURE__ */ jsx("span", { children: this.sliderCount() })
          ] })
        ]
      }
    ) : null;
  }
  sliderCount() {
    return this.getItems().length;
  }
  showSlide(index) {
    this.setState({ currentIndex: index });
  }
  componentDidMount() {
    super.componentDidMount();
    if (this.props.designer)
      return;
    this.startInterval();
  }
  startInterval() {
    const data = this.props.data;
    const interval = (parseInt(data.interval) || 5) * 1e3;
    this.interval = setInterval(() => {
      this.nextSlide();
    }, interval);
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    clearInterval(this.interval);
  }
  setFocus(focus = true, timeout = 100) {
    setTimeout(() => {
      this.setState({ focus, initialized: true });
    }, timeout);
  }
  /*binEvents() {
     //super.binEvents();
     if(this.props.designer) return;
     this.container.addEventListener("mouseenter", () => {
  		  this.pause = true;
     });
     this.container.addEventListener("mouseleave", () => {
  		  this.pause = false;
     });
  
     this.container.addEventListener("touchstart", () => {
  		  this.pause = true;
     });
  
     this.container.addEventListener("touchend", () => {
  		  this.pause = false;
     });
  
     this.container.addEventListener("keydown", (e) => {
  		  if(e.keyCode === 37){
  			   this.prevSlide();
  			   this.resetInterval();
  		  } else if(e.keyCode === 39){
  			   this.nextSlide();
  			   this.resetInterval();
  		  }
     });
  
     this.container.addEventListener("keyup", (e) => {
  		  if(e.keyCode === 37 || e.keyCode === 39){
  			   this.pause = false;
  		  }
     });
  
     this.container.addEventListener("click", () => {
  		  this.pause = false;
     });
  
     this.container.addEventListener("touchmove", () => {
  		  this.pause = false;
     });
   }*/
  resetInterval() {
    if (this.props.designer)
      return;
    clearInterval(this.interval);
    this.startInterval();
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);
  }
  get metaFields() {
    return [
      {
        group: "custom",
        elements: {
          use_for_all_slides: {
            element: SWITCH,
            data: {
              description: "If enabled, settings like interval, color overlay, animations will be used for each slide."
            }
          },
          transition: {
            element: SELECT,
            data: {
              options: loopar.animations()
            }
          },
          static_content: {
            element: SWITCH,
            data: {
              description: "If enabled the content will remain static even when there are animations in the slide."
            }
          },
          full_height: {
            element: SWITCH,
            data: {
              description: "If enabled the slider will have the height of the screen."
            }
          },
          interval: {
            element: SELECT,
            data: {
              label: "Interval",
              options: [
                { option: "5 Seconds", value: "5" },
                { option: "10 Seconds", value: "10" },
                { option: "15 Seconds", value: "15" },
                { option: "20 Seconds", value: "20" },
                { option: "25 Seconds", value: "25" },
                { option: "30 Seconds", value: "30" }
              ],
              selected: "5000"
            }
          },
          loop: { element: SWITCH },
          pause: { element: SWITCH },
          keyboard: { element: SWITCH },
          touch: { element: SWITCH },
          indicators: { element: SWITCH },
          arrows: { element: SWITCH }
        }
      }
    ];
  }
}
__publicField(BaseCarrusel, "contextType", DesignerContext);
export {
  BaseCarrusel as B
};
