import React, { useState, useRef, useEffect } from "react";
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@/lib/utils";
export const DesignElement = ({ parent, element, Comp, parentKey}) => {
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