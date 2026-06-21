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
    dragEnabled,
    updatingElement,
    handleEditElement
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

  const isDroppable = global.elementIsDroppable(elementProps.element);

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

  // True from pointerdown until pointerup (or drop). Used to paint the source
  // element with the same dashed-border treatment the placeholder uses, so
  // the user gets visual confirmation that the drag started even before
  // movement crosses MOVEMENT_THRESHOLD. Once threshold is crossed, the
  // cleanup effect removes this element from the local list and the
  // placeholder takes over — visual is continuous.
  const isBeingDragged = designing && currentDragging?.node === nodeKey;

  const className = useMemo(() => {
    return cn(
      "rounded-sm p-1",
      designing ? [
        //"bg-secondary",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05),inset_0_-1px_0_0_rgba(0,0,0,0.2)]",
        //elementProps.element === MARKDOWN && "max-h-[500px] overflow-y-auto"
      ] : "",
      elementProps.className,
      disabled && "p-2",
      isDroppable && designing && [
        //"bg-input",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08),inset_0_-1px_0_0_rgba(0,0,0,0.3)]",
        [COL, PANEL].includes(elementProps.element) && "h-full"
      ],
      designing ? [
        //elementProps. === MARKDOWN && "max-w-[300px] overflow-y-auto"
      ] : "",
      // Source-of-drag visual: matches the placeholder so the transition
      // (source → placeholder when threshold is crossed) is seamless.
      isBeingDragged && "border-2 border-dashed border-primary/70 opacity-60",
      "px-2"
    );
  }, [designing, elementProps.className, disabled, isDroppable, isBeingDragged]);

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
    if (!dragEnabled || e.button !== 0) return;

    const interactive = e.target.closest(
      'input, textarea, [contenteditable], .mdx-editor, .ProseMirror, .no-drag'
    );

    if (interactive) return;

    e.stopPropagation();

    const downX = e.clientX;
    const downY = e.clientY;
    const THRESHOLD = 6;
    let dragStarted = false;

    const onMove = (me) => {
      if (Math.abs(me.clientX - downX) <= THRESHOLD && Math.abs(me.clientY - downY) <= THRESHOLD) return;
      dragStarted = true;
      cleanup();
      setInitializedDragging(true);
      dragStart({ clientX: downX, clientY: downY });
    };
    const onUp = () => {
      cleanup();
      if (dragStarted || !designing) return;

      const alreadySelected = updatingElement && getNodeKey(updatingElement) === nodeKey;
      handleEditElement(alreadySelected ? null : nodeKey);
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }, [dragEnabled, setInitializedDragging, dragStart, designing, handleEditElement, nodeKey, updatingElement]);

  // The being-dragged opacity moved into `className` (opacity-60) so it
  // unifies with the placeholder visual. Inline style would override class
  // opacity, which would split the source's appearance from the placeholder.
  const isActive = hover && !dragging;

  const isSelected = designing && updatingElement && getNodeKey(updatingElement) === nodeKey;

  return (
    <HiddenContext.Provider value={disabled}>
      <div
        className={cn(
          "relative w-full h-auto",
          className,
          designing && isDroppable && "outline outline-1 outline-dashed outline-primary/25 outline-offset-2",
          designing && !isDroppable && isActive && "outline outline-1 outline-dashed outline-primary/30 outline-offset-2",
          isSelected && "outline outline-2 outline-primary outline-offset-2"
        )}
        ref={draggableRef}
        onPointerOver={(e) => {
          e.stopPropagation();
          handleMouseOver(true);
        }}
        onPointerOut={() => handleMouseOver(false)}
        onPointerDown={handleDragStart}
      >
        {designerModeType !== "preview" && (
          <ElementTitle
            element={element}
            active={isActive || isSelected}
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