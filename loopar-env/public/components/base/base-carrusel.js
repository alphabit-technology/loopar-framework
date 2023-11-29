import { button, span, div, Div } from "../elements.js";
import Preassembled from "./preassembled.js";
import { loopar } from "/loopar.js";


export default class BaseCarrusel extends Preassembled {
    blockComponent = true;
    tagName = "section";
    //className = "container container-fluid-xl";

    constructor(props) {
        super(props);

        this.state = {
            ...this.state,
            currentIndex: localStorage.getItem(this.props.meta.data.key) || 0,
            prevIndex: 0,
            focus: false,
            initialized: false
        };
    }

    getItemsRender() {
        const elementsDict = this.elementsDict || [];
        const { currentIndex, prevIndex } = this.state;
        const animation = this.getTransition();

        if(!elementsDict.length) return [];

        const items = [
            elementsDict[currentIndex],
        ]

        if(!this.props.designer){
            items.unshift(elementsDict[prevIndex]);
        }

        return Div({
            className: "position-relative w-100 h-100",
        }, [
            ...items.map((element, index) => {
                const key = element.data.key;
                const data = {
                    ...element.data,
                    animation: (index == 0 && !this.props.designer) ? null : animation,
                    delay: 300,
                    ...{
                        key: key
                    },
                    static_content: this.data.static_content,
                    background_color: this.data.color_overlay,
                    color_overlay: this.data.color_overlay,
                }

                return Div({
                    //className: (index == 0 ? "position-absolute hide-time" : "show-time") + " w-100 h-100",
                    className: "position-absolute w-100 h-100",
                    style: {
                        backgroundColor: loopar.utils.rgba(this.data.color_overlay),
                    }
                }, [
                    this.getElement({ ...element, element: element.element || "banner" }, {
                        className: (index == 0 && !this.props.designer) ? "hide-time" : "show-time",
                        meta: {
                            data,
                            elements: element.elements,
                            key: key
                        },
                        ref: tab => {
                            if (tab) {
                                if (this.props.designer) {
                                    tab.parentComponent = this;
                                }
                                this["slider" + index] = tab;
                            }
                        }
                    })
                ])

                /*return [
                    this.getElement({...element, element: element.element || "banner"}, {
                        className: (index == 0 && !this.props.designer) ? "position-absolute hide-time" : "show-time",
                        meta: {
                            data,
                            elements: element.elements,
                            key: key
                        },
                        ref: tab => {
                            if (tab) {
                                if (this.props.designer) {
                                    tab.parentComponent = this;
                                }
                                this["slider" + index] = tab;
                            }
                        }
                    }),
                ]*/
            })
        ]);
    }

    render(content){
        const data = this.props.meta?.data || {};
        this.className = `${this.className || ""} position-relative w-100`;

        this.style = {
            ...this.style,
            overflow: "hidden",
        }

        if (data.full_height) {
            this.className = `${this.className || ""} vh-100`;
            //this.style.height = (this.props.designer && loopar.designer) ? "calc(100vh + 60px)" : "100vh";
        } else {
            this.style.paddingTop = "60%"
        }
        
        return super.render([
            div({
                Component: this,
                ref: el => this.container = el,
                className: `align-items-center element position-absolute w-100 h-100`,
                style: {
                    top: 0
                },
                onMouseEnter: (e) => {
                    e.preventDefault();
                    e.preventDefault();
                    this.setFocus(true, 100);
                },
                onMouseLeave: (e) => {
                    e.preventDefault();
                    e.preventDefault();
                    this.setFocus(false, 300);
                },
            }, [
                this.getChevron("left"),
                content || this.getItemsRender(),
                this.getCounter(),
                this.getChevron("right"),
            ])
        ])
    }

    getTransition() {
        return loopar.getAnimation(this.data.transition, "flip");
    }

    getItems() {
        return this.props.meta.elements || [];
    }

    getNextSlideIndex() {
        return (this.state.currentIndex + 1) % this.getItems().length;
    }

    getPrevSlideIndex() {
        return (this.state.currentIndex - 1 + this.getItems().length) % this.getItems().length;
    }

    nextSlide = () => {
        this.setState((prevState) => ({
            prevIndex: prevState.currentIndex,
            currentIndex: this.getNextSlideIndex(),
        }), () => {
            localStorage.setItem(this.props.meta.data.key, this.state.currentIndex);
        });
    };

    prevSlide = () => {
        this.setState((prevState) => ({
            prevIndex: prevState.currentIndex,
            currentIndex: this.getPrevSlideIndex()
        }), () => {
            localStorage.setItem(this.props.meta.data.key, this.state.currentIndex);
        });
    };

    getCurrentSlide() {
        return this.getItems().find((e, index) => index === this.state.currentIndex);
    }

    get elementsDict() {
        return this.props.designer ? super.elementsDict : this.props.children || super.elementsDict;
    }

    getChevron(position) {
        return button({
            className: `w3-button w3-display-${position} p-9 transition ${this.state.focus ? "" : "ishide"}`,
            style: {
                zIndex: "99999999", padding: 20, margin: 20,
                ...(!this.state.initialized && { display: "none" } || {})
            },
            onClick: (e) => {
                e.preventDefault();
                position === "left" ? this.prevSlide() : this.nextSlide();
                this.resetInterval();
            }
        }, [
            span({
                className: `w3-xlarge w3-text-white w3-display-${position}`,
                style: {
                    fontSize: "3rem",
                    fontWeight: "bold",
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    width: "auto",
                    transform: "translate(-50%, -50%)"
                }
            }, [
                span({ className: `fa fa-chevron-${position}` })
            ])
        ]);
    }

    getIndicators() {
        return this.getItems().map((e, index) => {
            return button({
                className: `w3-button w3-white w3-display-bottommiddle`,
                style: {
                    zIndex: "99999999", padding: 20, margin: 20,
                    ...(!this.state.initialized && { display: "none" } || {})
                },
                onClick: (e) => {
                    e.preventDefault();
                    this.showSlide(index);
                    this.resetInterval();
                }
            }, [
                span({
                    className: `w3-xlarge w3-text-white w3-display-bottommiddle`,
                    style: {
                        fontSize: "3rem",
                        fontWeight: "bold",
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        width: "auto",
                        transform: "translate(-50%, -50%)"
                    }
                }, [
                    span({ className: `fa fa-circle` })
                ])
            ]);
        });
    }

    getCounter(){
        return this.props.designer ? [
            div({
                className: "position-absolute slider-index", 
                style: {fontSize: "2rem", bottom: 0, left: 5, width:"calc(100% - 5px)"}
            }, [
                button({
                    type: "button",
                    className: "btn btn-primary btn-floated position-absolute",
                    onClick: (e) => {
                        e.preventDefault();
                        this.addSlide();
                    }
                }, [
                    span({
                        className: "fa fa-plus"
                    })
                ]),
                /**Number of slide */
                    span({
                        className: "badge badge-primary"
                    }, [
                        span({}, (parseInt(this.state.currentIndex) + 1)),
                        span({ className: "text-muted" }, "/"),
                        span({}, this.sliderCount())
                    ])
            ])
        ] : null;
    }

    sliderCount() {
        return this.getItems().length;
    }

    showSlide(index) {
        this.setState({ currentIndex: index });
    }

    componentDidMount() {
        super.componentDidMount();
        loopar.includeCSS("/components/css/slider");
        if (this.props.designer) return;
        this.startInterval();
    }

    startInterval() {
        const data = this.props.meta.data;
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
                group: 'custom',
                elements: {
                    use_for_all_slides: {
                        element: SWITCH,
                        data: {
                            description: "If enabled, settings like interval, color overlay, animations will be used for each slide.",
                        }
                    },
                    transition: {
                        element: SELECT,
                        data: {
                            options: loopar.animations(),
                        }
                    },
                    static_content: {
                        element: SWITCH,
                        data: {
                            description: "If enabled the content will remain static even when there are animations in the slide.",
                        }
                    },
                    full_height: {
                        element: SWITCH,
                        data: {
                            description: "If enabled the slider will have the height of the screen.",
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
                                { option: "30 Seconds", value: "30" },
                            ],
                            selected: "5000"
                        }
                    },
                    loop: { element: SWITCH },
                    pause: { element: SWITCH },
                    keyboard: { element: SWITCH },
                    touch: { element: SWITCH },
                    indicators: { element: SWITCH },
                    arrows: { element: SWITCH },
                }
            }
        ];
    }
}
