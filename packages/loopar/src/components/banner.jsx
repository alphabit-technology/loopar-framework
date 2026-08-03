import {PreassembledContextProvider, usePreassembledContext} from "@preassembled";
import { cn } from "@cn/lib/utils";
import {Droppable} from "@droppable";
import {loopar} from "loopar";
import {useState, useRef, useEffect} from "react";
import { useDesigner } from "@context/@/designer-context";

const Cover = (props) => {
  const {designing} = useDesigner()
  const [isVisible, setIsVisible] = useState(designing || false);
  const elementRef = useRef(null);
  const animation = loopar.animation.getAnimation(props.animation) || {}

  useEffect(() => {
    if(designing) return;
    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, { threshold: 0.1 });

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, [designing]);

  return (
    <div 
      {...props}
      className={cn(props.className, (isVisible ? animation.visible : animation.initial))}
      ref={elementRef}
    />
  )
}

const Content = (props) => {
  const { isActive = true } = props;
  const {designing} = useDesigner();
  const [isVisible, setIsVisible] = useState(designing || false);
  
  useEffect(() => {
    if(designing) return;
    let timeout;
    
    if (isActive) {
      timeout = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
    } else {
      setIsVisible(false);
    }
    
    return () => clearTimeout(timeout);
  }, [isActive, designing]);

  const animationClassName = cn(
    "transition-all duration-700 ease-out",
    props.haveCarousel && (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
  )
  
  if (props.textBackground) {
    return (
      <div
        className={cn(
          props.wrapperClassName,
          designing ? '' : animationClassName
        )}
      >
        <div className={cn("flex h-full w-full p-4 md:p-8", props.className)}>
          <Droppable
            {...props}
            className={cn(
              "flex flex-col gap-4 w-full max-w-3xl bg-card/50 rounded-2xl p-6 md:p-10 shadow-lg",
              props.textBackgroundClass
            )}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        props.wrapperClassName,
        designing ? '' : animationClassName
      )}
    >
      <Droppable
        {...props}
        className={cn("h-full w-full flex flex-col gap-4", props.className,)}
      />
    </div>
  )
}

function Banner() {
  const {props} = usePreassembledContext()
  const data = props.data || {};
  const {designerMode} = useDesigner();

  const alignment = {
    center: "justify-center items-center",
    start: "justify-start items-start",
    end: "justify-end items-end",
  }[data?.alling || "center"];
  
  const coverClassName = cn(
    "h-full w-full",
    "transform transition-all ease-in-out",
    "absolute inset-0 z-0",
  );

  const isActive = data.isActive !== false;
  const animationDuration = (parseFloat(data.animation_duration) || 0.7);
  const textBackground = loopar.utils.trueValue(data.text_background);

  
  return (
    <div className={cn(
      props.className.split("transition-all")[0],
      "p-0 relative",
      data.full_height && !designerMode && "h-[calc(100vh-var(--spacing-web-header-height))] max-h-[calc(100vh-var(--spacing-web-header-height))]",
    )}>
      <Cover
        className={coverClassName}
        style={props.style}
        animation={data.animation}
      />
      <Content  
        elements={props.elements}
        // wrapperClassName="absolute inset-0 z-10 h-full w-full"
        wrapperClassName="inset-0 z-10 h-full w-full"
        className={cn(alignment, data.class)}
        isActive={isActive}
        animationDuration={animationDuration}
        haveCarousel={props.haveCarousel}
        textBackground={textBackground}
        textBackgroundClass={data.text_background_class}
      />
    </div>
  )
}

export default function MetaBanner(props){
  const data = props.data;
  const defaultElements = [
    {
      element: "title",
      node: props.node + "title",
      data: {
        text: data?.label || "Banner Title...",
        size: "3xl",
        text_align: "center",
      },
    },
    {
      element: "subtitle",
      node: props.node + "subtitle",
      data: {
        text: data?.text || "Subtitle...",
        text_align: "center",
      },
    },
  ];

  return (
    <PreassembledContextProvider {...props} defaultElements={defaultElements}>
      <Banner haveCarousel={props.haveCarousel} staticContent={data.static_content}/>
    </PreassembledContextProvider>
  )
}


MetaBanner.metaFields =()=>{
  return [{
    group: "custom",
    elements: {
      alling: {
        element: SELECT,
        data: {
          options: ["center", "start", "end"],
        }
      },
      full_height: {
        element: SWITCH,
        data: {
          description:
            "If enabled the slider will have the height of the screen.",
        },
      },
      text_background: {
        element: SWITCH,
        data: {
          label: "Text Background",
          description:
            "Render this banner's content inside a translucent themed panel so text stays readable over the background image. Overridden to ON when the parent carousel enables Text Background.",
        },
      },
      text_background_class: {
        element: INPUT,
        data: {
          label: "Text Background Class",
          description:
            "Optional Tailwind classes merged over the panel defaults (bg-card/50 backdrop-blur-sm rounded-2xl ...). E.g. 'bg-black/30' or 'bg-card/80 backdrop-blur-md'.",
        },
      },
    }
  }];
}