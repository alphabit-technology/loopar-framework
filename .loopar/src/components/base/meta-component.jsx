import React, { useState, useRef, useContext } from "react";
import { elementsDict as baseElementsDict } from "$global/element-definition";
import { __META_COMPONENTS__ } from "$components-loader";
import elementManage from "$tools/element-manage";
import { ElementTitle } from "$element-title";
import DragAndDropUtils from "$tools/drag-and-drop";
import { useDocument, useDesigner, HiddenContext } from "@custom-hooks";
import { cn } from "@/lib/utils";
import loopar from "$loopar";
import { useDocumentContext } from "@context/base/base-context";
import fileManager from "$tools/file-manager";

const designElementProps = (el) => {
  if (!el.data) {
    const names = elementManage.elementName(props.element);
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

      animations["data-aos"] = animation;
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

const DesignElement = ({ parent, element, Comp, def }) => {
  const [hover, setHover] = useState(false);
  const document = useDocument();
  const designer = useDesigner();
  const parentHidden = useContext(HiddenContext);

  const dragginElement = useRef(null);
  const isDroppable = Comp.prototype.droppable || element.fieldDesigner;
  let className = Comp.prototype.designerClasses || "";

  if (document.mode !== "preview") {
    if (isDroppable) {
      className = cn(className, "min-h-20 rounded-md border border-gray-400 shadow bg-gray-200/80 dark:bg-slate-800/70 p-2 pb-4 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:border-gray-600 dark:hover:shadow-lg");
    } else {
      className = cn(className, "bg-gray-300 p-2 mb-4 dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-md");
    }
  }

  className = cn(className, element.data?.class, element.className);

  const handleMouseOver = (e) => {
    e.stopPropagation();
    setHover(true);
  }

  const handleEditElement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleEditElement(dragginElement.current);
  }

  const handleDeleteElement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleDeleteElement(dragginElement.current)
  }

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
  const disabled = element.data.hidden || element.data.disabled;
  const Fragment = (disabled && !parentHidden) ? "div" : React.Fragment;
  const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};

  return (
    <HiddenContext.Provider value={disabled}>
      <div
        className={cn('relative w-full h-auto', className)}
        style={{ opacity: hover ? 0.8 : 1, ...element.style }}
        draggable={!element.fieldDesigner}
        onDragStartCapture={(e) => {
          DragAndDropUtils.elementToDrag = dragginElement.current;
        }}
        onDragEnter={e => {
          e.preventDefault();
          e.stopPropagation();

          if (DragAndDropUtils.lastElementTargetSibling) {
            if (DragAndDropUtils.currentElementTargetSibling.identifier !== dragginElement.current.identifier) {

              DragAndDropUtils.lastElementTargetSibling = DragAndDropUtils.currentElementTargetSibling;
            }
          } else {
            DragAndDropUtils.lastElementTargetSibling = dragginElement.current;
          }

          DragAndDropUtils.currentElementTargetSibling = dragginElement.current;
        }}

        onMouseOver={handleMouseOver}
        onMouseOut={() => setHover(false)}
      >
        {
          document.mode !== "preview" &&
          <ElementTitle
            element={element}
            active={hover}
            handleEditElement={handleEditElement}
            handleDeleteElement={handleDeleteElement}
            style={{ top: 0 }}
          />
        }
        <Fragment {...fragmentProps}>
          <Comp {...element}
            ref={self => {
              if (self) {
                self.parentComponent = parent;
                dragginElement.current = self;
              }
            }}
          />
        </Fragment>
      </div>
    </HiddenContext.Provider>
  )
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

function MetaComponents({ elements = [], parent, className }) {
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
}


export default function MetaComponentBase({ elements, parent, className }) {
  return (
    <MetaComponents elements={elements} parent={parent} className={className} />
  );
};

export const MetaComponent = ({ component = "div", render, parent, ...props }) => {
  const C = __META_COMPONENTS__[component];
  const isDesigner = useDesigner().designerMode;
  const ref = useRef(null);

  if (C && C.default) {
    if (isDesigner) {
      return (
        <DesignElement Comp={C.default} element={{ ...props, ...{ element: component } }} dragginElement={ref}>
          {render && render(C.default, ref)}
        </DesignElement>
      )
    }

    return (
      render && render(C.default)
    )
  } else {
    throw new Error(`Component ${component} not included in the initial bundle`);
  }
}