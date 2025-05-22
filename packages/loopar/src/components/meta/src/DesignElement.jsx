import { useState, useRef, useEffect, useCallback, useMemo, use } from "react";
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { useDragAndDrop } from "@@droppable/DragAndDropContext";
import { cn } from "@cn/lib/utils";

export const DesignElement = ({ element, Comp, parentKey }) => {
  const [hover, setHover] = useState(false);
  const debouncedHover = useRef(null);

  const { 
    designerModeType,
    designing
  } = useDesigner();

  const { 
    currentDragging, 
    setCurrentDragging, 
    setDropZone,
    setInitializedDragging,
    dragging,
  } = useDragAndDrop();

  const parentHidden = useHidden();
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
      />
    );
  }

  const handleMouseOver = useCallback(isHover => {
    if(designerModeType === "preview" || currentDragging) return;
    if (debouncedHover.current) {
      clearTimeout(debouncedHover.current);
    }
    debouncedHover.current = setTimeout(() => {
      setHover(isHover);
    }, 30);
  }, [currentDragging, designerModeType]);

  const disabled = useMemo(() => {
    return elementProps.data && (elementProps.data.hidden || elementProps.data.disabled);
  }, [elementProps.data]);

  /**const selfDragging = useMemo(() => {
    return designing && currentDragging && currentDragging.key === elementProps.data.key;
  }, [designing, currentDragging, elementProps.data.key]);*/

  const className = useMemo(() => {
    return cn(
      designing ? "bg-card rounded p-2 mb-4 cursor-grab" : "",
      elementProps.className,
      designing && "border border-gray-400 dark:border-gray-600",
      disabled && "p-2"
    );
  }, [designing, elementProps.className, currentDragging, elementProps.data.key]);

  const dragStart = (e) => {
    const el = {
      data: { ...elementProps.data },
      element: elementProps.element,
      elements: elementProps.elements,
    };

    const rect = draggableRef.current.getBoundingClientRect();

    setDropZone(parentKey);
    setCurrentDragging({
      key: el.data.key,
      parentKey,
      el,
      ref: draggableRef.current,
      initialPosition: {
        x: e.clientX,
        y: e.clientY,
      },
      offset: {
        x: e.clientX - rect.x,
        y: e.clientY - rect.y,
      },
      size: {
        width: rect.width,
        height: rect.height,
      },
      className,
    });
  };

  const handleDragStart = useCallback((e) => {
    e.stopPropagation();
    if(designerModeType === "preview") return;

    setInitializedDragging(true);
    dragStart(e);
  }, [designerModeType, setCurrentDragging]);

  const style = useMemo(() => {
    if (designing && currentDragging && currentDragging.key === elementProps.data.key) {
      return {
        cursor: currentDragging && designerModeType ? "grabbing" : "grab",
      };
    }
    return {};
  }, [currentDragging, designing, elementProps.data.key]);

  return (
    <HiddenContext.Provider value={disabled}>
      <div
        className={cn("relative w-full h-auto", className)}
        ref={draggableRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleMouseOver(true);
        }}
        onPointerOut={() => handleMouseOver(false)}
        onPointerDown={handleDragStart}
        style={style}
      >
        {designerModeType !== "preview" && (
          <ElementTitle element={elementProps} active={hover && !dragging} style={{ top: 0 }} />
        )}
        {disabled ? <div className="absolute top-0 left-0 w-full h-full bg-stone-700/60 z-1 rounded" /> : null}
        <Comp {...elementProps} key={elementKey}/>
      </div> 
    </HiddenContext.Provider>
  );
};
