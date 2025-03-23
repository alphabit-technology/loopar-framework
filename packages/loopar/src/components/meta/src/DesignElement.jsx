import React, { useState, useRef, useEffect, useCallback } from "react";
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";

export const DesignElement = ({ parent, element, Comp, parentKey }) => {
  const [hover, setHover] = useState(false);
  const { designerModeType, currentDragging, setCurrentDragging, designing } = useDesigner();
  const parentHidden = useHidden();
  const draggingElement = useRef(null);
  const { __REFS__ } = useDroppable();
  const draggableRef = useRef(null);
  const { key: elementKey, ...elementProps } = element;

  useEffect(() => {
    if (!elementProps.data) return;
    const key = elementProps.data.key;
    if (key) {
      __REFS__[key] = draggableRef.current;
      return () => {
        delete __REFS__[key];
      };
    }
  }, [elementProps.data, __REFS__]);

  if (parentHidden) {
    return (
      <Comp
        {...elementProps}
        key={elementKey || null}
        ref={(self) => {
          if (self) {
            self.parentComponent = parent;
            draggingElement.current = self;
          }
        }}
      />
    );
  }

  const className = cn(
    designing ? "bg-card rounded p-2 mb-4 border border-gray-400 dark:border-gray-600" : "",
    elementProps.className
  );

  const handleMouseOver = useCallback(
    (isHover) => {
      if (!currentDragging) setHover(isHover);
    },
    [currentDragging]
  );

  const disabled = elementProps.data && (elementProps.data.hidden || elementProps.data.disabled);
  const Wrapper = disabled && !parentHidden ? "div" : React.Fragment;
  const fragmentProps = disabled ? { className: "pointer-events-none opacity-40" } : {};

  const handleDragStart = useCallback(
    (e) => {
      e.stopPropagation();

      const img = new Image();
      img.src =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/wcAAgAB/axl7kYAAAAASUVORK5CYII=";
      e.dataTransfer.setDragImage(img, 0, 0);
      e.dataTransfer.effectAllowed = "move";

      const el = {
        data: { ...elementProps.data },
        element: elementProps.element,
        elements: elementProps.elements,
      };

      e.target.style.opacity = 1;

      setCurrentDragging({
        el,
        key: el.data.key,
        parentKey,
        ref: e.target,
        rect: e.target.getBoundingClientRect(),
        mousePosition: { x: e.clientX, y: e.clientY },
        className,
      });
    },
    [elementProps, parentKey, setCurrentDragging, className]
  );

  const handleDragEnd = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.clearData();
  }, []);

  return (
    <HiddenContext.Provider value={disabled}>
      <div
        className={cn("relative w-full h-auto", className)}
        draggable={!elementProps.fieldDesigner}
        ref={draggableRef}
        onMouseOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleMouseOver(true);
        }}
        onMouseOut={() => handleMouseOver(false)}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {designerModeType !== "preview" && (
          <ElementTitle element={elementProps} active={hover && !currentDragging} style={{ top: 0 }} />
        )}
        <Wrapper {...fragmentProps}>
          <Comp {...elementProps} key={elementKey} ref={draggingElement} />
        </Wrapper>
      </div>
    </HiddenContext.Provider>
  );
};
