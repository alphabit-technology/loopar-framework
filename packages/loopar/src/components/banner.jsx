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
  const animation = loopar.getAnimation(props.animation) || {}

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
    props.haveCarrusel && (isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")
  )
  
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

  const alignment = {
    center: "justify-center items-center",
    start: "justify-start items-start",
    end: "justify-end items-end",
  }[data?.alling || "center"];
  
  const coverClassName = cn(
    "h-full w-full",
    "transform transition-all ease-in-out",
    "absolute inset-0 z-0"
  );

  const isActive = data.isActive !== false;
  const animationDuration = (parseFloat(data.animation_duration) || 0.7);

  return (
    <div className={cn(props.className.split("transition-all")[0], "p-0 relative min-h-100")}>
      <Cover
        className={coverClassName}
        style={props.style}
        animation={data.animation}
      />
      <Content  
        elements={props.elements}
        data={{key: data.key}} 
        wrapperClassName="absolute inset-0 z-10 h-full w-full"
        className={cn(alignment, data.class)}
        isActive={isActive}
        animationDuration={animationDuration}
        haveCarrusel={props.haveCarrusel}
      />
    </div>
  )
}

export default function MetaBanner(props){
  const data = props.data;
  const defaultElements = [
    {
      element: "title",
      data: {
        key: data.key + "title",
        text: data?.label || "Banner Title...",
        size: "3xl",
        text_align: "center",
      },
    },
    {
      element: "subtitle",
      data: {
        key: data.key + "subtitle",
        text: data?.text || "Subtitle...",
        text_align: "center",
      },
    },
  ];

  return (
    <PreassembledContextProvider {...props} defaultElements={defaultElements}>
      <Banner haveCarrusel={props.haveCarrusel} staticContent={data.static_content}/>
    </PreassembledContextProvider>
  )
}

MetaBanner.designerClasses = "h-full w-full p-3 py-6";

MetaBanner.metaFields =()=>{
  return [{
    group: "custom",
    elements: {
      alling: {
        element: SELECT,
        data: {
          options: ["center", "start", "end"],
        }
      }
    }
  }];
}