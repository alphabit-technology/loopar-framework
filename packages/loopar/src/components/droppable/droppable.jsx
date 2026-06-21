import React, { useState, useEffect, useRef, useCallback } from "react";
import { useHidden } from "@context/@/hidden-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import loopar from "loopar";
import MetaComponent from "@meta-component";
import { useDragAndDrop } from "./DragAndDropContext";
import { DroppableContextProvider, useDroppable } from "./DroppableContext";
import { getNodeKey } from "@global/prune-doc-structure";
const UP = 'up';
import { isEqual } from "es-toolkit/predicate";

function DroppableContainer({ data = {}, node, children, className, Component = "div", ...props }) {
  const [elements, setElements] = useState(props.elements || []);
  const [position, setPosition] = useState(null);
  const [movementTick, setMovementTick] = useState(0);

  const {
    dropZone,
    currentDragging,
    movementRef,
    subscribeToMovement,
    dragging,
    setGlobalPosition,
    verticalDirectionRef,
    reconcileNonce,
  } = useDragAndDrop();

  const {droppableEvents, dragOver, __REFS__} = useDroppable();

  const dropZoneRef = useRef();
  const dataKeyRef = useRef(node);
  const activeDropZoneRef = useRef(dropZone);
  dataKeyRef.current = node;
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

  // Deep-equal drop: props never change so the sync above won't fire. Only the
  // container that mutated its local state during the drag differs from props,
  // so it resets and drops the leftover placeholder; others are equal and skip.
  useEffect(() => {
    if (!reconcileNonce) return;
    const canonical = props.elements || [];
    if (!isEqual(elements, canonical)) {
      prevElements.current = canonical;
      setElements(canonical);
    }
  }, [reconcileNonce]);

  const setElement = (element, afterAt, current) => {
    current = currentDragging?.node;

    const newElements = [...elements].filter(el => {
      if (!el) return false;
      if (el.$$typeof === Symbol.for('react.transitional.element')) return false;
      const k = getNodeKey(el);
      return k && k != current;
    });

    element && newElements.splice(afterAt, 0, element);

    handleSetElements(newElements);
  };

  useEffect(() => {
    if (dropZone == null) return;
    const { dragging: d, movement: m, currentDragging: cd, elements: els } = dragSyncRef.current;
    if (!d || !m) return;
    const cleared = els.filter(el =>
      el.$$typeof !== Symbol.for('react.transitional.element') &&
      (cd ? getNodeKey(el) !== cd.node : true)
    );
    handleSetElements(cleared);
  }, [dropZone, node]);

  useEffect(() => {
    if (dropZone === node && position != null) {
      setGlobalPosition(position);
    }
  }, [dropZone, position, node, setGlobalPosition]);

  const getBrothers = useCallback((current) => {
    return Object.entries(__REFS__)
      .filter(([node, el]) => el && node !== current)
      .map(([, el]) => el.getBoundingClientRect());
  }, [__REFS__]);

  const getIndex = useCallback((currentNode) => {
    const brothers = getBrothers(currentNode);
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
    if(!dropZone || dropZone !== node || position == null) return;
    if (!currentDragging || currentDragging.node == node) return;

    const { size } = currentDragging;
    const { height } = size;

    setElement(
      <div
        key={currentDragging.node}
        style={{ maxHeight: height }}
        className={`${currentDragging.className} pointer-events-none opacity-60 border-2 border-dashed border-primary/70`}
        dangerouslySetInnerHTML={{ __html: currentDragging.ref?.innerHTML }}
      />,
      position
    );
  }, [position, dropZone, node, currentDragging, dragging, movementRef]);

  useEffect(() => {
    if(!dragging) return;

    if(dropZone && dropZone == node && currentDragging) {
      if (currentDragging.node === node) return;

      const i = getIndex(currentDragging.node);
      position !== i && setPosition(i);
    }
  }, [movementTick, dropZone, currentDragging, dragging, node]);

  const renderizableProps = loopar.utils.renderizableProps(props);

  const ClassNames = cn(
    //"rounded",
    "h-full min-h-20 w-full p-1 space-y-3 py-3 pt-4",
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
        parentKey={node}
      />
    </div>
  );
}

export function Droppable(props) {
  const {node, children, className, elements, Component = "div"} = props;
  const { designerMode, designerModeType, dragEnabled } = useDesigner();
  const hidden = useHidden();
  const renderizableProps = loopar.utils.renderizableProps(props);
  const C = (designerMode && hidden) ? "div" : Component === "fragment" ? React.Fragment : Component;

  if(designerMode && (designerModeType != "preview" || dragEnabled) && !hidden && !fieldIsWritable(props)) return (
    <DroppableContextProvider {...props}>
      <DroppableContainer {...props} />
    </DroppableContextProvider>
  )

  return (
    <C {...(C.toString() == 'Symbol(react.fragment)' ? {} : { ...renderizableProps, className: className })}>
      {children} <MetaComponent elements={elements} parentKey={node} />
    </C>
  );
}