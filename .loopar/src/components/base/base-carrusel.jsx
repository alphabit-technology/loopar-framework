import Preassembled from "$preassembled";
import loopar from "$loopar";
import AOS from "aos";
import MetaComponent from "@meta-component";
import { DesignerContext } from "@custom-hooks";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

export default class BaseCarrusel extends Preassembled {
  static contextType = DesignerContext;

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      currentIndex: loopar.cookie.get(this.props.data.key) || 0,
      prevIndex: 0,
      focus: false,
      initialized: false,
    };
  }

  getItemsRender() {
    const elementsDict = this.elementsDict || [];
    const baseData = this.props.data || {};

    if (!elementsDict.length) return [];

    const { currentIndex, prevIndex } = this.state;
    const transition = this.getTransition();
    const items = [elementsDict[currentIndex]];
    const designerMode = this.context.design;

    !designerMode && items.unshift(elementsDict[prevIndex]);

    return (
      <div
       className={`relative w-full h-full ${designerMode ? "pt-3" : ""}`}
      >
        {...items.map((element, index) => {
          const key = element.data.key;

          const data = {
            ...element.data,
            animation: index == 0 && !designerMode ? null : transition,
            static_content: baseData.static_content,
            delay: 300,
            background_color: baseData.background_color,
            background_blend_mode: baseData.background_blend_mode,
            key,
          };                                                                                                                          

          return (
            <div
              className="absolute w-full h-full"
            >
              <MetaComponent
                elements={[
                  {
                    ...element,
                    element: element.element || "banner",
                    /*className: !this.props.designer
                      ? index == 0
                        ? "hide-time"
                        : "show-time"
                      : "",*/
                    data,
                    elements: element.elements,
                    key: key,
                    ref: (tab) => {
                      if (tab) {
                        this["slider" + index] = tab;
                      }
                    },
                  },
                ]}
                key={key}
              />
            </div>
          );
        })}
      </div>
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

    return (
      <div 
        className="relative w-full"
        style={{
          ...style,
          overflow: "hidden",
        }}
      >
        <div
          className={`align-items-center absolute w-full h-full`}
          style={{
            overflow: "hidden",
            top: 0,
          }}
          onMouseEnter={(e) => {
            e.preventDefault();
            this.setFocus(true, 100);
          }}
          onMouseLeave={(e) => {
            e.preventDefault();
            this.setFocus(false, 300);
          }}
        >
          {this.getChevron("left", ChevronLeftIcon)}
          {content || this.getItemsRender()}
          {/*this.getCounter()*/}
          {this.getChevron("right", ChevronRightIcon)}
        </div>
      </div>
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
    return (
      (this.state.currentIndex - 1 + this.getItems().length) %
      this.getItems().length
    );
  }

  nextSlide = () => {
    this.setState(
      (prevState) => ({
        prevIndex: prevState.currentIndex,
        currentIndex: this.getNextSlideIndex(),
      }),
      () => {
        loopar.cookie.set(this.props.data.key, this.state.currentIndex);
        //localStorage.setItem(this.props.data.key, this.state.currentIndex);
      }
    );
  };

  prevSlide = () => {
    this.setState(
      (prevState) => ({
        prevIndex: prevState.currentIndex,
        currentIndex: this.getPrevSlideIndex(),
      }),
      () => {
        loopar.cookie.set(this.props.data.key, this.state.currentIndex);
        //localStorage.setItem(this.props.data.key, this.state.currentIndex);
      }
    );
  };

  getCurrentSlide() {
    return this.getItems().find(
      (e, index) => index === this.state.currentIndex
    );
  }

  get elementsDict() {
    return this.context.designerMode
      ? super.elementsDict
      : this.props.children || super.elementsDict;
  }

  getChevron(position, Icon) {
    const _position = position === "left" ? "left-5" : "right-5";
    return (
      <button
        className={`hidden md:d-block lg:d-block z-10 md:inline-flex lg:inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-background/60 shadow-sm hover:bg-accent absolute rounded-full top-1/2 -translate-y-1/2 h-20 w-20 ${
          this.state.focus ? "" : ""
        } ${_position}`}
        onClick={(e) => {
          e.preventDefault();
          position === "left" ? this.prevSlide() : this.nextSlide();
          this.resetInterval();
        }}
      >
        <Icon className="w-19 h-19" />
      </button>
    );
  }

  getIndicators() {
    return this.getSliders().map((e, index) => (
      <button
        className="w3-button w3-white w3-display-bottommiddle"
        style={{
          zIndex: "99999999",
          padding: 20,
          margin: 20,
          ...(this.state.initialized ? {} : { display: "none" }),
        }}
        onClick={(e) => {
          e.preventDefault();
          this.showSlide(index);
          this.resetInterval();
        }}
      >
        <span
          className="w3-xlarge w3-text-white w3-display-bottommiddle"
          style={{
            fontSize: "3rem",
            fontWeight: "bold",
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "auto",
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className="fa fa-circle" />
        </span>
      </button>
    ));
  }

  getCounter() {
    return this.context.designerMode ? (
      <div
        className="position-absolute slider-index"
        style={{
          fontSize: "2rem",
          bottom: 0,
          left: 5,
          width: "calc(100% - 5px)",
        }}
      >
        <button
          type="button"
          className="btn btn-primary btn-floated position-absolute"
          onClick={(e) => {
            e.preventDefault();
            this.addSlide();
          }}
        >
          <span className="fa fa-plus" />
        </button>
        <span className="badge badge-primary">
          <span>{parseInt(this.state.currentIndex) + 1}</span>
          <span className="text-muted">/</span>
          <span>{this.sliderCount()}</span>
        </span>
      </div>
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
    if (this.context.designerMode) return;
    this.startInterval();
  }

  startInterval() {
    const data = this.props.data;
    const interval = (parseInt(data.interval) || 5) * 1000;
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
    if (this.props.designer) return;
    AOS.refresh();
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
              description:
                "If enabled, settings like interval, color overlay, animations will be used for each slide.",
            },
          },
          transition: {
            element: SELECT,
            data: {
              options: loopar.animations(),
            },
          },
          static_content: {
            element: SWITCH,
            data: {
              description:
                "If enabled the content will remain static even when there are animations in the slide.",
            },
          },
          full_height: {
            element: SWITCH,
            data: {
              description:
                "If enabled the slider will have the height of the screen.",
            },
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
                { option: "30 Seconds", value: "30" },
              ],
              selected: "5000",
            },
          },
          loop: { element: SWITCH },
          pause: { element: SWITCH },
          keyboard: { element: SWITCH },
          touch: { element: SWITCH },
          indicators: { element: SWITCH },
          arrows: { element: SWITCH },
        },
      },
    ];
  }
}
