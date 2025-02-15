import React, { useState, useRef, useEffect } from "react";
import { __META_COMPONENTS__ } from "@components-loader";
import { cn } from "@/lib/utils";
import loopar from "loopar";
import PureHTMLBlock from "@pure-html-block";
import {Animations } from "./meta";

export const MetaRender = ({ meta, metaProps, Comp, docRef, parent, data, threshold = 0.1 }) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => observer.disconnect();
  }, []);

  let className = metaProps.className;
  let style = metaProps.style || {};

  if (data.animation && Animations[data.animation]) {
    const animation = Animations[data.animation];

    className = cn(
      className,
      `transform transition-all ease-in-out`,
      isVisible ? animation.visible : animation.initial
    );

    style = {
      ...style || {},
      transitionDelay: `${(data?.delay || 0) * 1000}ms`,
      transitionDuration: `${(data?.duration || 3) * 1000}ms`,
    };
  }
  
  if ([HTML_BLOCK, MARKDOWN].includes(meta.element)) {
    return <PureHTMLBlock
      element={meta} {...loopar.utils.renderizableProps(metaProps)}
      data={data}
      className={className}
      style={style}
    />
  }

  if (!Comp) return null;

  return (
    <Comp
      {...metaProps}
      key={metaProps.key || null}
      className={className}
      style={style}
      value={data.value}
      ref={ref => {
        if (ref) {
          elementRef.current = ref;
        }
        docRef.__REFS__[data.name] = ref;
        parent?.__REFS__ && (parent.__REFS__[data.name] = ref);
      }
    } />
  );
}
