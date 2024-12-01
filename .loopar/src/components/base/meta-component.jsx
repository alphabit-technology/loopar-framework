import React, { useState, useRef, useEffect, useId } from "react";
import { elementsDict as baseElementsDict } from "@global/element-definition";
import { __META_COMPONENTS__, ComponentsLoader } from "@components-loader";
import elementManage from "@tools/element-manage";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@/lib/utils";
import loopar from "loopar";
import { useDocument } from "@context/@/document-context";
import fileManager from "@tools/file-manager";
import { useWorkspace } from "@workspace/workspace-provider";
import { ErrorBoundary } from "@error-boundary"

const designElementProps = (el) => {
  if (!el.data) {
    const names = elementManage.elementName(el.element);
    el.data = {
      label: names.label,
      key: names.id
    }
  }

  const newProps = {
    ...{
      ...el,
      key: 'design-element' + el.data.key
    }
  }

  return newProps;
};

function prepareMetaData(props, parent, image) {
  const data = props.data || {};
  
  if (image && (!data || !data.background_image || data.background_image === '[]')) {
    props.src = "/uploads/empty-image.svg"
  }

  const getSrc = () => {
    if (data) {
      return fileManager.getMappedFiles(data.background_image, data.name);
    }
    return [];
  }

  if (data) {
    const backgroundColor = {};
    if (data?.background_color) {
      const color = loopar.utils.rgba(data.background_color);

      if (color) {
        Object.assign(backgroundColor, {
          backgroundColor: color,
          backgroundBlendMode: data.background_blend_mode || 'normal',
        });
      }
    }

    const animations = {};

    if ((data.animation || parent?.data?.static_content)) {
      const animation = parent?.data?.static_content ? loopar.reverseAnimation(parent.data.animation) : loopar.getAnimation(data.animation);

      animations["data-aos"] = animation; <q></q>
      data.static_content = parent?.data?.static_content;

      if (data.animation_delay) {
        animations["data-aos-delay"] = data.animation_delay;
      }

      if (data.animation_duration && data.animation_duration > 0) {
        animations["data-aos-duration"] = data.animation_duration;
      } else {
        animations["data-aos-duration"] = 2000;
      }

      //Object.assign(props, animations);
    }

    if (data.background_image && data.background_image !== '[]') {
      
      const src = getSrc();
      
      if (src && src.length > 0) {
        const imageUrl = src[0].src || "/uploads/empty-image.svg";

        const backgroundImage = {
          backgroundImage: `url("${imageUrl}")`,
          backgroundSize: data.background_size || "cover",
          backgroundPosition: data.background_position || "center",
          backgroundRepeat: data.background_repeat || "no-repeat",
          ...backgroundColor
        }

        props.imageProps = {
          src: imageUrl
        }

        if (props.element === "image") {
          Object.assign(props.imageProps, {
            alt: data.label || "",
            title: data.description || "",
            style: {
              display: "none"
            }
          });

          props.coverProps = {
            style: {
              ...backgroundImage
            },
            ...animations
          }

          if (data.aspect_ratio) {
            props.style = {
              ...props.style || {}
            }
          }
        } else {
          props.style = {
            ...props.style || {},
            ...backgroundImage
          };
        }
      }
    }

    if (props.element !== "image") {
      props.style = {
        ...props.style || {},
        ...backgroundColor
      };

      Object.assign(props, animations);
    }
  }
}

const elementProps = ({ elDict, parent = {}, isDesigner }) => {
  prepareMetaData(elDict, parent, false);

  if (isDesigner) return designElementProps(elDict, parent);
  elDict.data ??= {};
  const data = elDict.data;

  return {
    element: elDict.element,
    ...{
      key: elDict.key || "element" + data.key,
    },
    ...elDict,
  };
};

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
  const Fragment = (disabled && !parentHidden) ? "div" : React.Fragment;
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
        <Fragment {...fragmentProps}>
          <Comp {...element}
            key={element.key}
            ref={dragginElement}
            //className={className}
          />
        </Fragment>
      </div>
    </HiddenContext.Provider>
  )
};

function HTMLBlock({ element, className = "", ...props }) {
  /*if(element.element == MARKDOWN){
    return <Markdown id={element.data.id} className={`h-auto w-full prose dark:prose-invert pb-5`} >{element.data.value}</Markdown>
  }else{*/
    return (
      <div
        className={`h-auto w-full prose dark:prose-invert pb-5`}
        id={element.data.id}
        dangerouslySetInnerHTML={{ __html: element.data.value }}
        {...props}
      />
    )
  //}
}

function evaluateCondition(condition, values) {
  let sanitizedCondition = condition.replace(/and/g, '&&').replace(/or/g, '||').replace(/=/g, '==');

  const keys = Object.keys(values);
  keys.forEach(key => {
    const value = values[key];
    const regex = new RegExp(`\\b${key}\\b`, 'g');
    sanitizedCondition = sanitizedCondition.replace(regex, `'${value}'`);
  });

  try {
    return new Function(`return ${sanitizedCondition};`)();
  } catch (error) {
    console.error("Error evaluating condition:", error);
    return false;
  }
}

function extractFieldNames(condition) {
  const sanitizedCondition = condition.replace(/and/g, '&&').replace(/or/g, '||');
  const regex = /\b([a-zA-Z_]\w*)\b(?=\s*[=!><])/g;
  const matches = new Set();
  let match;

  while ((match = regex.exec(sanitizedCondition)) !== null) {
    matches.add(match[1]);
  }

  return Array.from(matches);
}

const MetaComponentFn = ({ el, parent, parentKey, className }) => {
  if(el && el.$$typeof === Symbol.for("react.element")){
    return el;
  }

  const designer = useDesigner();
  const { docRef, formValues } = useDocument();
  const isDesigner = designer.designerMode;
  const _props = elementProps({ elDict: el, parent, isDesigner });
  
  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === el.element));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  const def = baseElementsDict[el.element]?.def || {};
  const { ENVIRONMENT } = useWorkspace();

  const isDisplay = () => {
    if (_props.data?.display_on){
      const fields = extractFieldNames(_props.data?.display_on);

      const values = fields.reduce((acc, field) => {
        acc[field] = formValues[field];
        return acc;
      }, {});

      return evaluateCondition(_props.data?.display_on, values);
    }else{
      return ![true, "true", "1", 1].includes(_props.data?.hidden);
    }
  }

  /*const [display, setDisplay] = useState(isDisplay());

  useEffect(() => {
    docRef.__REFS__[el.data.name] = {
      ..._props.data,
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
    const data = _props.data || {};

    _props.className = cn("relative", (Comp && Comp.designerClasses), _props.className, "rounded", el.className, className, data?.class);

    if (docRef.__META_DEFS__[data.name]) {
      const newData = {
        ...data,
        ...docRef.__META_DEFS__[data.name]?.data || {}
      };

      Object.assign(_props, docRef.__META_DEFS__[data.name], { data: newData });
    }

    if (isDesigner && Comp) {
      return (
        <DesignElement
          Comp={Comp}
          element={_props}
          parent={parent}
          parentKey={parentKey}
          def={def}
        />
      )
    } else if (!data.hidden && display) {
      const disabled = data.disabled;
      const Fragment = disabled ? "div" : React.Fragment;
      const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};

      if ([HTML_BLOCK, MARKDOWN].includes(el.element)) {
        return <HTMLBlock element={el} {...loopar.utils.renderizableProps(_props)} />
      }

      if (!Comp) return null;
      delete _props.key;

      return (
        <Fragment {...fragmentProps}>
          <Comp
            {..._props}
            ref={ref => {
              //console.log(["ref", docRef]);
              docRef.__REFS__[data.name] = ref;
              parent?.__REFS__ && (parent.__REFS__[data.name] = ref);
            }
          } />
        </Fragment>
      );
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
      <ErrorBoundary>
        <MetaComponentFn 
          el={el}
          parent={parent}
          className={className}
          parentKey={parentKey}
          key={key}
        />
      </ErrorBoundary>
    )
  });
}

export const MetaComponent = ({ component = "div", render, parent, ...props }) => {
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