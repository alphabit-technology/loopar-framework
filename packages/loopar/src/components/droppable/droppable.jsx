import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHidden } from "@context/@/hidden-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import loopar from "loopar";
import MetaComponent from "@meta-component";
import { useDragAndDrop } from "./DragAndDropContext";
import { DroppableContextProvider, useDroppable } from "./DroppableContext";
const UP = 'up';
import { isEqual } from "es-toolkit/predicate";

function DroppableContainer({ data = {}, children, className, Component = "div", ...props }) {
  const [elements, setElements] = useState(props.elements || []);
  const [position, setPosition] = useState(null);
  // Local tick that increments when *this* droppable is the active dropZone
  // and the global movement publishes. Replaces consuming `movement` from
  // context state, which would re-render every droppable on the page.
  const [movementTick, setMovementTick] = useState(0);

  const {
    dropZone,
    currentDragging,
    movementRef,
    subscribeToMovement,
    dragging,
    setGlobalPosition,
    verticalDirectionRef,
  } = useDragAndDrop();

  const {droppableEvents, dragOver, __REFS__} = useDroppable();

  const dropZoneRef = useRef(); // DOM ref of the container element
  const dataKeyRef = useRef(data.key);
  const activeDropZoneRef = useRef(dropZone);
  dataKeyRef.current = data.key;
  activeDropZoneRef.current = dropZone;
  const prevElements = useRef(props.elements);
  const dragSyncRef = useRef({
    dragging,
    movement: movementRef?.current,
    currentDragging,
    elements: props.elements || [],
  });
  dragSyncRef.current = {
    dragging,
    movement: movementRef?.current,
    currentDragging,
    elements,
  };

  // Subscribe to global movement, but only re-render if this droppable is
  // currently the active dropZone. Inactive droppables stay completely
  // dormant during a drag — this is the core win of the refactor.
  useEffect(() => {
    if (!subscribeToMovement) return;
    return subscribeToMovement(() => {
      if (activeDropZoneRef.current === dataKeyRef.current) {
        setMovementTick((t) => t + 1);
      }
    });
  }, [subscribeToMovement]);

  const handleSetElements = (elements) => {
    if(isEqual(prevElements.current, elements)) return;
    prevElements.current = elements;
    setElements(elements);
  }

  useEffect(() => {
    handleSetElements(props.elements || []);
  }, [props.elements]);

  const setElement = (element, afterAt, current) => {
    current = currentDragging?.key;

    const newElements = [...elements].filter(el => {
      const key = el.data?.key;
      return key && key != current;
    });

    element && newElements.splice(afterAt, 0, element);

    handleSetElements(newElements);
  };

  // Cleanup pass: when dropZone transitions in/out, drop any stale React
  // elements (placeholder leftovers) and remove the dragged item from this
  // container's local list. This used to be combined with the globalPosition
  // publish below, which made the whole filter+isEqual run on every position
  // tick — wasted work for the inactive droppables.
  useEffect(() => {
    if (dropZone == null) return;
    const { dragging: d, movement: m, currentDragging: cd, elements: els } = dragSyncRef.current;
    if (!d || !m) return;
    const cleared = els.filter(el =>
      el.$$typeof !== Symbol.for('react.transitional.element') &&
      (cd ? el.data?.key !== cd.key : true)
    );
    handleSetElements(cleared);
  }, [dropZone, data.key]);

  // Publish the active droppable's position to the global insertion target.
  // Only fires when this droppable is the dropZone and position is set —
  // independent of the cleanup pass above.
  useEffect(() => {
    if (dropZone === data.key && position != null) {
      setGlobalPosition(position);
    }
  }, [dropZone, position, data.key, setGlobalPosition]);

  // Rects must be read fresh every frame: once the placeholder is inserted,
  // sibling DOM nodes shift and a memoized snapshot would point getIndex at
  // stale positions, causing the placeholder to drift away from the cursor.
  const getBrothers = useCallback((current) => {
    return Object.entries(__REFS__)
      .filter(([key, el]) => el && key !== current)
      .map(([, el]) => el.getBoundingClientRect());
  }, [__REFS__]);

  const getIndex = useCallback((currentKey) => {
    const brothers = getBrothers(currentKey);
    const movement = movementRef?.current;

    if (!movement) return brothers.length;
    if (brothers.length === 0) return 0;

    const draggedTop = movement.y - currentDragging.offset.y;
    const draggedBottom = draggedTop + currentDragging.size.height;
    const verticalDirection = verticalDirectionRef?.current ?? global.verticalDirection;

    for (let i = 0; i < brothers.length; i++) {
      const rect = brothers[i];

      if (verticalDirection === UP) {
        if (draggedTop < (rect.y + (rect.height * 0.75))) return i;
      } else {
        if ((rect.y + (rect.height * 0.25)) > draggedBottom) return i;
      }
    }

    return brothers.length;
  }, [
    getBrothers,
    currentDragging,
    movementRef,
    verticalDirectionRef,
  ]);

  useEffect(() => {
    if(!dragging || !movementRef?.current) return
    if(!dropZone || dropZone !== data.key || position == null) return;
    if (!currentDragging || currentDragging.key == data?.key) return;

    const { size } = currentDragging;
    const { height } = size;

    setElement(
      <div
        key={currentDragging.key}
        style={{ maxHeight: height }}
        className={`${currentDragging.className} pointer-events-none opacity-60 border-2 border-dashed border-primary/70`}
        dangerouslySetInnerHTML={{ __html: currentDragging.ref?.innerHTML }}
      />,
      position
    );
  }, [position, dropZone, data.key, currentDragging, dragging, movementRef]);

  useEffect(() => {
    if(!dragging) return;

    if(dropZone && dropZone == data.key && currentDragging) {
      if (currentDragging.key === data.key) return;

      const i = getIndex(currentDragging.key);
      position !== i && setPosition(i);
    }
    // movementTick is the trigger: it only increments when this droppable
    // is active, so we recompute the placeholder index in sync with cursor
    // movement without re-rendering siblings.
    //
    // IMPORTANT: do NOT add `position` (or `getIndex`) to the dep array. The
    // setPosition call below would re-trigger this effect, and getIndex —
    // which reads live brother rects — returns different values once the
    // placeholder shifts the layout. That feedback loop blew the React max
    // update depth on every drag. The closure's `position` is correct
    // because each movementTick re-creates the closure with the latest
    // value before this effect runs.
  }, [movementTick, dropZone, currentDragging, dragging, data.key]);

  const renderizableProps = loopar.utils.renderizableProps(props);

  const ClassNames = cn(
    "rounded",
    "bg-card h-full min-h-20 w-full p-2 space-y-3 py-3 pt-4",
    dragOver ? 'bg-gradient-to-r from-slate-400/30 to-slate-600/60 shadow' : "",
    className,
    renderizableProps.className
  );

  return (
    <div
      {...{
        ...renderizableProps,
        ...droppableEvents,
      }}
      ref={dropZoneRef}
      className={ClassNames}
    >
      {children}
      <MetaComponent
        elements={elements}
        parentKey={data.key}
      />
    </div>
  );
}

export function Droppable(props) {
  const {data = {}, children, className, elements, Component = "div"} = props;
  const { designerMode, designerModeType } = useDesigner();
  const hidden = useHidden();
  const renderizableProps = loopar.utils.renderizableProps(props);
  const C = (designerMode && hidden) ? "div" : Component === "fragment" ? React.Fragment : Component;

  if(designerMode && designerModeType != "preview" && !hidden && !fieldIsWritable(props)) return (
    <DroppableContextProvider {...props}>
      <DroppableContainer {...props} />
    </DroppableContextProvider>
  )

  return (
    <C {...(C.toString() == 'Symbol(react.fragment)' ? {} : { ...renderizableProps, className: className })}>
      {children} <MetaComponent elements={elements} parentKey={data.key} />
    </C>
  );
}