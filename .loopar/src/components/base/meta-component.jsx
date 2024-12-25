import React, { useState, useRef, useEffect, useId } from "react";
import { elementsDict as baseElementsDict } from "@global/element-definition";
import { __META_COMPONENTS__, ComponentsLoader } from "@components-loader";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@/lib/utils";
import loopar from "loopar";
import { useDocument } from "@context/@/document-context";
import { useWorkspace } from "@workspace/workspace-provider";
import { ErrorBoundary } from "@error-boundary"
import PureHTMLBlock from "@pure-html-block";
import { buildMetaProps, Animations, extractFieldNames, evaluateCondition } from "@meta";

const DesignElement = ({ parent, element, Comp, parentKey}) => {
  const [hover, setHover] = useState(false);
  const {designerModeType, currentDragging, setCurrentDragging, designing} = useDesigner();
  const parentHidden = useHidden();
  const dragginElement = useRef(null);
  const {__REFS__} = useDroppable();
  const draggableRef = useRef(null);

  useEffect(() => {
    __REFS__[element.data.key] = draggableRef.current;
  }, [__REFS__, draggableRef.current]);

  if (parentHidden) {
    return (
      <Comp {...element}
        key={element.key || null}
        ref={self => {
          if (self) {
            self.parentComponent = parent;
            dragginElement.current = self;
          }
        }}
      />
    )
  }

  const className = cn(
    designing ? "bg-card rounded p-2 mb-4 border border-gray-400 dark:border-gray-600" : "",
    element.className
  );

  const handleMouseOver = (hover) => {
    !currentDragging && setHover(hover);
  }

  delete element.key;

  const disabled = element.data && (element.data.hidden || element.data.disabled);
  const Wrapper = (disabled && !parentHidden) ? "div" : React.Fragment;
  const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};

  return (
    <HiddenContext.Provider value={disabled}>
      <div
        className={cn('relative w-full h-auto', className)}
        draggable={!element.fieldDesigner}
        ref={draggableRef}
        onMouseOver={e => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseOver(true);
        }}
        onMouseOut={e => {
          handleMouseOver(false);
        }}
        onDragStart={(e) => {
          e.stopPropagation();

          const img = new Image();
          img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgAB/axl7kYAAAAASUVORK5CYII=';
          e.dataTransfer.setDragImage(img, 0, 0);
          e.dataTransfer.effectAllowed = "move"
          
          const el = { 
            data: Object.assign({}, element.data), 
            element: element.element, 
            elements: element.elements
          };

          e.target.style.opacity = 1;

          setCurrentDragging({
            el,
            key: el.data.key,
            parentKey: parentKey,
            ref: e.target,
            rect: e.target.getBoundingClientRect(),
            mousePosition: {x: e.clientX, y: e.clientY},
            className: className,
          });
        }}
        onDragEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.clearData();
        }}
      >
        {
          designerModeType !== "preview" &&
          <ElementTitle
            element={element}
            active={hover && !currentDragging}
            style={{ top: 0 }}
          />
        }
        <Wrapper {...fragmentProps}>
          <Comp {...element}
            key={element.key}
            ref={dragginElement}
            //className={className}
          />
        </Wrapper>
      </div>
    </HiddenContext.Provider>
  )
};

const MetaRender = ({ el, metaProps, Comp, docRef, parent, data, threshold = 0.1 }) => {
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
  
  if ([HTML_BLOCK, MARKDOWN].includes(el.element)) {
    return <PureHTMLBlock
      element={el} {...loopar.utils.renderizableProps(metaProps)}
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
      ref={ref => {
        if (ref) {
          elementRef.current = ref;
        }
        //console.log(["ref", docRef]);
        docRef.__REFS__[data.name] = ref;
        parent?.__REFS__ && (parent.__REFS__[data.name] = ref);
      }
    } />
  );
}

const MetaComponentFn = ({ el, parent, parentKey, className }) => {
  if(el && el.$$typeof === Symbol.for("react.transitional.element")){
    return el;
  }

  const designer = useDesigner();
  const { docRef, formValues } = useDocument();
  const isDesigner = designer.designerMode;
  const metaProps = buildMetaProps({ metaProps: el, parent, isDesigner });
  
  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === el.element));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  const def = baseElementsDict[el.element]?.def || {};
  const { ENVIRONMENT } = useWorkspace();

  const isDisplay = () => {
    if (metaProps.data?.display_on){
      const fields = extractFieldNames(metaProps.data?.display_on);

      const values = fields.reduce((acc, field) => {
        acc[field] = formValues[field];
        return acc;
      }, {});

      return evaluateCondition(metaProps.data?.display_on, values);
    }else{
      return ![true, "true", "1", 1].includes(metaProps.data?.hidden);
    }
  }

  /*const [display, setDisplay] = useState(isDisplay());

  useEffect(() => {
    docRef.__REFS__[el.data.name] = {
      ...metaProps.data,
      hidden: !display
    }

    setDisplay(isDisplay());
  }, [formValues]);*/

  if(ENVIRONMENT === "server" && (isDesigner || def.designerOnly !== true)) {
    global.__REQUIRE_COMPONENTS__.push(el.element);
  }

  const display = isDisplay();
  useEffect(() => {
    if (!Comp && (isDesigner || def.designerOnly !== true)) {
      ComponentsLoader([el.element], () => {
        setLoadedComponents(Object.keys(__META_COMPONENTS__).find(c => c === el.element));
      });
    }
  }, []);

  if (Comp || [HTML_BLOCK, MARKDOWN].includes(el.element)) {
    const data = metaProps.data || {};

    metaProps.className = cn("relative", (Comp && Comp.designerClasses), metaProps.className, "rounded", el.className, className, data?.class);

    if (docRef.__META_DEFS__[data.name]) {
      const newData = {
        ...data,
        ...docRef.__META_DEFS__[data.name]?.data || {}
      };

      Object.assign(metaProps, docRef.__META_DEFS__[data.name], { data: newData });
    }

    if (isDesigner && Comp && data.wrapper !== true) {
      return (
        <DesignElement
          Comp={Comp}
          element={metaProps}
          parent={parent}
          parentKey={parentKey}
          def={def}
        />
      )
    } else if (!data.hidden && display) {
      const disabled = data.disabled;
      const Wrapper = disabled ? "div" : React.Fragment;
      const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};

      return (
        <Wrapper {...fragmentProps}>
          <MetaRender
            Comp={Comp}
            el={el}
            parent={parent}
            parentKey={parentKey}
            docRef={docRef}
            data={data}
            threshold={0.1}
            metaProps={metaProps}
          />
        </Wrapper>
      )
    }
  } else {
    //console.warn(["Component: " + def.element + " is not loaded yet"]);
    return null;
  }
};

export default function MetaComponentBase ({ elements=[], parent, className, parentKey }) {
  return elements.map((el) => {
    const key = parentKey + (el.data?.key || useId());

    return (
      <MetaComponentFn 
        el={el}
        parent={parent}
        className={className}
        parentKey={parentKey}
        key={key}
      />
    )
  });
}

export const MetaComponent = ({ component = "div", render, ...props }) => {
  const isDesigner = useDesigner().designerMode;
  const ref = useRef(null);

  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === component));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  useEffect(() => {
    if (!Comp) {
      ComponentsLoader([component], () => {
        setLoadedComponents(Object.keys(__META_COMPONENTS__).find(c => c === component));
      });
    }
  }, []);

  if(!Comp) return null;

  if (isDesigner) {
    return (
      <DesignElement Comp={Comp} element={{ ...props, ...{ element: component } }}>
        {render && render(Comp, ref)}
      </DesignElement>
    )
  }

  return render(Comp, ref);
}