import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "../../droppable/DroppableContext.jsx";
import { useDesigner } from "@context/@/designer-context";
import { useDragAndDrop } from "@@droppable/DragAndDropContext";
import { cn } from "@cn/lib/utils";

export const DesignElement = memo(function DesignElement(props) {
  const { element, Comp, parentKey } = props;
  const [hover, setHover] = useState(false);
  const debouncedHover = useRef(null);

  const { 
    designerModeType,
    designing,
    dragEnabled
  } = useDesigner();

  const { 
    currentDragging, 
    setCurrentDragging, 
    setDropZone,
    setInitializedDragging,
    dragging
  } = useDragAndDrop();

  const parentHidden = useHidden();
  const { __REFS__ } = useDroppable();
  const draggableRef = useRef(null);
  const { key: elementKey, ...elementProps } = element;

  const isDroppable = !fieldIsWritable(elementProps) && Comp.droppable !== false;

  useEffect(() => {
    if (!elementProps.data) return;
    const key = elementProps.data.key;

    if (key && __REFS__) {
      __REFS__[key] = draggableRef.current;
      return () => {
        delete __REFS__[key];
      };
    }
  }, [elementProps.data?.key, __REFS__]);

  if (parentHidden) {
    return <Comp {...elementProps} />;
  }

  const handleMouseOver = useCallback((isHover) => {
    if (designerModeType === "preview" || currentDragging) return;
    
    if (debouncedHover.current) {
      clearTimeout(debouncedHover.current);
    }
    debouncedHover.current = setTimeout(() => {
      setHover(isHover);
    }, 30);
  }, [currentDragging, designerModeType]);

  const disabled = useMemo(() => {
    return elementProps.data && (elementProps.data.hidden || elementProps.data.disabled);
  }, [elementProps.data?.hidden, elementProps.data?.disabled]);

  const className = useMemo(() => {
    return cn(
      "rounded p-1",
      designing ? [
        "border border-primary/30",
        "bg-secondary",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_-1px_0_0_rgba(0,0,0,0.2)]",
        //elementProps.element === MARKDOWN && "max-h-[500px] overflow-y-auto"
      ] : "",
      elementProps.className,
      disabled && "p-2",
      isDroppable && designing && [
        "bg-input",
        "border-1 border-primary/40",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-1px_0_0_rgba(0,0,0,0.3)]",
        [COL, PANEL].includes(elementProps.element) && "h-full"
      ],
      designing ? [
        //elementProps. === MARKDOWN && "max-w-[300px] overflow-y-auto"
      ] : "",
    );
  }, [designing, elementProps.className, disabled, isDroppable]);

  const dragStart = useCallback((e) => {
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
  }, [elementProps, parentKey, setDropZone, setCurrentDragging, className]);

  const handleDragStart = useCallback((e) => {
    if (!dragEnabled || e.button !== 0 || designerModeType === "preview") return;

    const interactive = e.target.closest(
      'input, textarea, [contenteditable], .mdx-editor, .ProseMirror, .no-drag'
    );

    if (interactive) return;

    e.stopPropagation();
    setInitializedDragging(true);
    dragStart(e);
  }, [dragEnabled, designerModeType, setInitializedDragging, dragStart]);

  const style = useMemo(() => {
    if (designing && currentDragging?.key === elementProps?.data?.key) {
      return { opacity: 0.4 };
    }
    return undefined;
  }, [currentDragging?.key, designing, elementProps?.data?.key]);

  const isActive = hover && !dragging;

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
          <ElementTitle
            element={elementProps}
            active={isActive}
            isDroppable={isDroppable}
            onDragStart={handleDragStart}
          />
        )}
        {disabled ? (
          <div className="absolute top-0 left-0 w-full h-full bg-stone-700/60 z-1 rounded" />
        ) : null}
        <Comp {...elementProps} key={elementKey} />
      </div>
    </HiddenContext.Provider>
  );
});