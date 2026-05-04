import { useState, useRef, useEffect, useCallback, useMemo, memo } from "react";
import { __META_COMPONENTS__ } from "@loopar/components-loader";
import { ElementTitle } from "@element-title";
import { HiddenContext, useHidden } from "@context/@/hidden-context";
import { useDroppable } from "../../droppable/DroppableContext.jsx";
import { useDesigner } from "@context/@/designer-context";
import { useDragAndDrop } from "@@droppable/DragAndDropContext";
import { cn } from "@cn/lib/utils";
import { getNodeKey } from "@global/prune-doc-structure";

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
  const { node: elementNode, ...elementProps } = element;

  const isDroppable = !fieldIsWritable(elementProps) && Comp.droppable !== false;

  // CRITICAL: read the identity from `element` (the original), NOT from
  // `elementProps`. The destructuring above removes `node`, so
  // getNodeKey(elementProps) falls back to `getUniqueKey()` and generates a
  // random identity - this breaks drag-drop (REMOVE doesn't find the child
  // by its new random) and generates duplicates when dropping between containers.
  const nodeKey = elementNode ?? getNodeKey(element);
  useEffect(() => {
    if (!elementProps.data) return;
    if (nodeKey && __REFS__) {
      __REFS__[nodeKey] = draggableRef.current;
      return () => {
        delete __REFS__[nodeKey];
      };
    }
  }, [nodeKey]);

  if (parentHidden) {
    return <Comp {...elementProps} node={elementNode}/>;
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
      node: nodeKey,
      data: { ...elementProps.data },
      element: elementProps.element,
      elements: elementProps.elements,
    };

    const rect = draggableRef.current.getBoundingClientRect();

    setDropZone(parentKey);
    setCurrentDragging({
      node: nodeKey,
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
  }, [
    nodeKey,
    elementProps.data,
    elementProps.element,
    elementProps.elements,
    parentKey,
    setDropZone,
    setCurrentDragging,
    className,
  ]);

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
    if (designing && currentDragging?.node === nodeKey) {
      return { opacity: 0.4 };
    }
    return undefined;
  }, [currentDragging?.node, designing, nodeKey]);

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
            element={element}
            active={isActive}
            isDroppable={isDroppable}
            onDragStart={handleDragStart}
          />
        )}
        {disabled ? (
          <div className="absolute top-0 left-0 w-full h-full bg-stone-700/60 z-1 rounded" />
        ) : null}
        <Comp {...elementProps} node={elementNode}/>
      </div>
    </HiddenContext.Provider>
  );
});