import { useState, useEffect, useRef } from 'react';
import loopar from "loopar";
import AOS from "aos";
import { useDesigner } from "@context/@/designer-context";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Droppable } from "@droppable";
import { Button } from "@/components/ui/button";

const BaseCarrusel = (props) => {
  const data = props.data || {};
  const {designerMode} = useDesigner();
  const [currentIndex, setCurrentIndex] = useState(loopar.cookie.get(data.key) || 0);
  const [prevIndex, setPrevIndex] = useState(0);
  const [focus, setFocus] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const intervalRef = useRef(null);

  const getTransition = () => {
    return loopar.getAnimation(data.transition, "flip");
  };

  const getItems = () => {
    return props.elements || [];
  };

  const getNextSlideIndex = () => {
    return (currentIndex + 1) % getItems().length;
  };

  const getPrevSlideIndex = () => {
    return (currentIndex - 1 + getItems().length) % getItems().length;
  };

  const nextSlide = () => {
    setPrevIndex(currentIndex);
    setCurrentIndex(getNextSlideIndex());
    loopar.cookie.set(data.key, getNextSlideIndex());
  };

  const prevSlide = () => {
    setPrevIndex(currentIndex);
    setCurrentIndex(getPrevSlideIndex());
    loopar.cookie.set(data.key, getPrevSlideIndex());
  };

  const getElementsDict = () => { 
    return props.children || props.elements || [];
  };

  const getItemsRender = () => {
    const elementsDict = getElementsDict();
    const baseData = data || {};

    if (!elementsDict.length) return [];

    const transition = getTransition();
    const items = [elementsDict[currentIndex]];

    !designerMode && items.unshift(elementsDict[prevIndex]);

    return (
      <div className={`relative w-full h-full ${designerMode ? "pt-3" : ""}`}>
        {items.map((element, index) => {
          if(element.$$typeof === Symbol.for("react.transitional.element")) return element;

          const key = element.data.key;

          const data = {
            ...element.data,
            animation: index === 0 && !designerMode ? null : transition,
            static_content: baseData.static_content,
            delay: 300,
            background_color: baseData.background_color,
            background_blend_mode: baseData.background_blend_mode,
            key,
          };

          return (
            <Droppable
              className="absolute w-full h-full"
              elements={[
                {
                  ...element,
                  element: element.element || "banner",
                  data,
                  elements: element.elements,
                  ref: (tab) => {
                    if (tab) {
                      sliderRef.current[index] = tab;
                    }
                  },
                },
              ]}
              key={key}
            />
          );
        })}
      </div>
    );
  };

  const getCurrentSlide = () => {
    return getItems().find((e, index) => index === currentIndex);
  };

  const getChevron = (position, Icon) => {
    const _position = position === "left" ? "left-5" : "right-5";
    return (
      <button
        className={`hidden md:d-block lg:d-block z-10 md:inline-flex lg:inline-flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-background/60 shadow-sm hover:bg-accent absolute rounded-full top-1/2 -translate-y-1/2 h-20 w-20 ${
          focus ? "" : ""
        } ${_position}`}
        onClick={(e) => {
          e.preventDefault();
          position === "left" ? prevSlide() : nextSlide();
          resetInterval();
        }}
      >
        <Icon className="w-19 h-19" />
      </button>
    );
  };

  const getIndicators = () => {
    return getItems().map((e, index) => (
      <button
        className="w3-button w3-white w3-display-bottommiddle"
        style={{
          zIndex: "99999999",
          padding: 20,
          margin: 20,
          ...(initialized ? {} : { display: "none" }),
        }}
        onClick={(e) => {
          e.preventDefault();
          setCurrentIndex(index);
          resetInterval();
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
  };

  const getCounter = () => {
    return designerMode ? (
      <div
        className="position-absolute slider-index"
        style={{
          fontSize: "2rem",
          bottom: 0,
          left: 5,
          width: "calc(100% - 5px)",
        }}
      >
        <Button
          variant="primary"
          onClick={(e) => {
            e.preventDefault();
            // Implement addSlide function if needed
          }}
        >
          <span className="fa fa-plus" />
        </Button>
        <span className="badge badge-primary">
          <span>{parseInt(currentIndex) + 1}</span>
          <span className="text-muted">/</span>
          <span>{getItems().length}</span>
        </span>
      </div>
    ) : null;
  };

  const startInterval = () => {
    const interval = (parseInt(data.interval) || 5) * 1000;
    intervalRef.current = setInterval(() => {
      nextSlide();
    }, interval);
  };

  const resetInterval = () => {
    if (props.designer) return;
    AOS.refresh();
    clearInterval(intervalRef.current);
    startInterval();
  };

  useEffect(() => {
    if (designerMode) return;
    startInterval();

    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

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
        className="align-items-center absolute w-full h-full"
        style={{
          overflow: "hidden",
          top: 0,
        }}
        onMouseEnter={(e) => {
          e.preventDefault();
          setFocus(true, 100);
        }}
        onMouseLeave={(e) => {
          e.preventDefault();
          setFocus(false, 300);
        }}
      >
        {getChevron("left", ChevronLeftIcon)}
        {props.content || getItemsRender()}
        {getCounter()}
        {getChevron("right", ChevronRightIcon)}
      </div>
    </div>
  );
};

export default BaseCarrusel;

BaseCarrusel.droppable = true;
BaseCarrusel.getMetaFields = () => {
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