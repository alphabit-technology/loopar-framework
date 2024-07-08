import React, { useState, useRef, useContext, useEffect, useId } from "react";
import { elementsDict as baseElementsDict } from "$global/element-definition";
import { __META_COMPONENTS__, ComponentsLoader } from "$components-loader";
import elementManage from "$tools/element-manage";
import { ElementTitle } from "$element-title";
import { useDesigner, HiddenContext, useDroppable } from "@custom-hooks";
import { cn } from "@/lib/utils";
import loopar from "$loopar";
import { useDocumentContext } from "@context/base/base-context";
import fileManager from "$tools/file-manager";
import { useWorkspace } from "@workspace/workspace-provider";

const designElementProps = (el) => {
  if (!el.data) {
    const names = elementManage.elementName(el.element);
    el.data = {
      name: names.name,
      label: names.label,
      id: names.id,
      key: names.id
    }
  }

  el.data.key ??= elementManage.getUniqueKey();

  const newProps = {
    ...{
      ...el,
      key: 'design-element' + el.data.key,
      //readOnly: selfProps.readOnly,
      hasTitle: true,
      dragabble: true
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
              //paddingTop: loopar.utils.aspectRatio(data.aspect_ratio) + "%",
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
              ...props.style || {},
              ...{
                //paddingTop: loopar.utils.aspectRatio(data.aspect_ratio) + "%",
              },
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
  const {mode} = useDesigner();
  const parentHidden = useContext(HiddenContext);
  const {currentDragging, setCurrentDragging} = useDesigner();
  const dragginElement = useRef(null);
  const isDroppable = Comp.prototype.droppable || element.fieldDesigner;
  let className = Comp.prototype.designerClasses || "";

  if (mode !== "preview") {
    if (isDroppable) {
      className = cn(className, "min-h-20 rounded-md border border-gray-400 shadow bg-gray-200/80 dark:bg-slate-800/70 mb-4 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:border-gray-600 dark:hover:shadow-lg p-3 pt-5");
    } else {
      className = cn(className, "bg-gray-300 p-2 mb-4 dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-md");
    }
  }

  className = cn(className, element.data?.class, element.className);

  const handleMouseOver = (hover) => {
    !currentDragging && setHover(hover);
  }

  delete element.key;
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
  const disabled = element.data && (element.data.hidden || element.data.disabled);
  const Fragment = (disabled && !parentHidden) ? "div" : React.Fragment;
  const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};
  
  const {__REFS__} = useDroppable();
  const draggableRef = useRef(null);

  useEffect(() => {
    __REFS__[element.data.key] = draggableRef.current;
  }, [__REFS__, draggableRef.current]);

  return (
    <HiddenContext.Provider value={disabled}>
      <div
        key={element.data.key} //necesary for droppable
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
          //e.preventDefault();
          e.stopPropagation();
          const img = new Image();
          img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgAB/axl7kYAAAAASUVORK5CYII=';
          e.dataTransfer.setDragImage(img, 0, 0);
          //DragAndDropUtils.dataTransfer = draggableRef.current;
          //e.dataTransfer.type 
          e.dataTransfer.effectAllowed = "move"
          
          const el = { 
            data: Object.assign({}, element.data), 
            element: element.element, 
            elements: element.elements
          };

          //console.log(["target", e.target])
          setCurrentDragging({
            el,
            key: el.data.key,
            parentKey: parentKey,
            ref: e.target,
            rect: e.target.getBoundingClientRect(),
            mousePosition: {x: e.clientX, y: e.clientY}
          });
        }}
        onDragEnd={(e) => {
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.clearData();
          //DragAndDropUtils.elementOverDrag = null;
        }}
      >
        {
          mode !== "preview" &&
          <ElementTitle
            element={element}
            //elementRef={dragginElement.current}
            active={hover && !currentDragging}
            style={{ top: 0 }}

          />
        }
        <Fragment {...fragmentProps}>
          <Comp {...element}
            
            ref={self => {
              if (self) {
                self.parentComponent = parent;
                dragginElement.current = self;
                //__REFS__[element.key] = self;
              }
            }}
          />
        </Fragment>
      </div>
    </HiddenContext.Provider>
  )
  /**Old */
};

function HTMLBlock({ element, className = "", ...props }) {
  return (
    <div
      className={`h-auto w-full prose dark:prose-invert pb-5`}
      id={element.data.id}
      dangerouslySetInnerHTML={{ __html: element.data.value }}
      {...props}
    />
  )
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

/*function MetaComponents({ elements = [], parent, className }) {
  const designer = useDesigner();
  const { docRef, formValues } = useDocumentContext();
  const isDesigner = designer.designerMode;

  return (
    <>
      {elements.map((el, index) => {
        const def = baseElementsDict[el.element]?.def || {};
        el.def = def;
        const Comp = __META_COMPONENTS__[def.element]?.default || __META_COMPONENTS__[def.element];
        const props = elementProps({ elDict: el, parent, isDesigner });

        let display = true;
        if (props.data?.display_on){
          const fields = extractFieldNames(props.data?.display_on);

          const values = fields.reduce((acc, field) => {
            acc[field] = formValues[field];
            return acc;
          }, {});

          display = evaluateCondition(props.data?.display_on, values);
        }

        if (Comp || [HTML_BLOCK, MARKDOWN].includes(el.element)) {
          const data = props.data || {};
          props.className = cn("relative", (Comp && Comp.prototype.designerClasses), props.className, data?.class, "rounded-md", el.className, className);

          if (docRef.__META_DEFS__[data.name]) {
            const newData = { ...data, ...docRef.__META_DEFS__[data.name]?.data || {} };
            Object.assign(props, docRef.__META_DEFS__[data.name], { data: newData });
          }

          if (isDesigner && Comp) {
            return <DesignElement key={index} Comp={Comp} element={props} parent={parent} def={def} />;
          } else if (!data.hidden && display) {
            const disabled = data.disabled;

            const Fragment = disabled ? "div" : React.Fragment;
            const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};

            if ([HTML_BLOCK, MARKDOWN].includes(el.element)) {
              return <HTMLBlock key={index} element={el} {...loopar.utils.renderizableProps(props)} />
            }

            if (!Comp) return null;

            return (
              <Fragment {...fragmentProps}>
                <Comp
                  {...props}
                  key={props.key || index}
                  ref={ref => {
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
      })}
    </>
  );
}*/

const MetaComponentFn = ({ el, parent, parentKey, className }) => {
  if(el && el.$$typeof === Symbol.for("react.element")){
    return el;
  }

  const designer = useDesigner();
  const { docRef, formValues } = useDocumentContext();
  const isDesigner = designer.designerMode;

  const [loadComponent, setLoadedComponents] = useState(Object.keys(__META_COMPONENTS__).find(c => c === el.element));
  const Comp = __META_COMPONENTS__[loadComponent]?.default || __META_COMPONENTS__[loadComponent];

  const def = baseElementsDict[el.element]?.def || {};
  el.def = def;
  const _props = elementProps({ elDict: el, parent, isDesigner });
  const { ENVIRONMENT } = useWorkspace();

  if(ENVIRONMENT === "server") {
    global.__REQUIRE_COMPONENTS__.push(el.element);
  }


  let display = true;
  if (_props.data?.display_on){
    const fields = extractFieldNames(_props.data?.display_on);

    const values = fields.reduce((acc, field) => {
      acc[field] = formValues[field];
      return acc;
    }, {});

    display = evaluateCondition(_props.data?.display_on, values);
  }

  useEffect(() => {
    if (!Comp) {
      ComponentsLoader([el.element], () => {
        setLoadedComponents(Object.keys(__META_COMPONENTS__).find(c => c === el.element));
      });
    }
  }, []);

  if (Comp || [HTML_BLOCK, MARKDOWN].includes(el.element)) {
    const data = _props.data || {};

    _props.className = cn("relative", (Comp && Comp.prototype.designerClasses), _props.className, data?.class, "rounded-md", el.className, className);

    if (docRef.__META_DEFS__[data.name]) {
      const newData = { ...data, ...docRef.__META_DEFS__[data.name]?.data || {} };
      Object.assign(_props, docRef.__META_DEFS__[data.name], { data: newData });
    }

    if (isDesigner && Comp) {
      return <DesignElement Comp={Comp} element={_props} parent={parent} parentKey={parentKey} def={def}/>;
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
            //key={data.key}
            //key={_props.key || props.key}
            ref={ref => {
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

export default function MetaComponentBase ({ elements=[], parent, className, parentKey }){
  return elements.map((el) => <MetaComponentFn el={el} parent={parent} className={className} parentKey={parentKey}/>);
}

export const MetaComponent = ({ component = "div", render, parent, ...props }) => {
  const isDesigner = useDesigner().design;
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

  return (
    render && render(Comp)
  )
}