import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useHidden } from "@context/@/hidden-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import loopar from "loopar";
import MetaComponent from "@meta-component";
import { useDragAndDrop } from "./DragAndDropContext";
import { DroppableContextProvider, useDroppable } from "./DroppableContext";
const UP = 'up';
import _ from "lodash";
import memoize from 'lodash.memoize';

function DroppableContainer({ data = {}, children, className, Component = "div", ...props }) {
  const [elements, setElements] = useState(props.elements || []);
  const [position, setPosition] = useState(null);

  const { 
    dropZone, 
    currentDragging, 
    movement,
    draggingEvent,
    dragging,
    setGlobalPosition,
  } = useDragAndDrop();

  const {droppableEvents, dragOver, __REFS__} = useDroppable();

  const dropZoneRef = useRef();
  const prevElements = useRef(props.elements);

  const handleSetElements = (elements) => {
    if(_.isEqual(prevElements.current, elements)) return;
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

  useEffect(() => {
    if(dropZone == null) return;
    handleSetElements(clearDragged());

    if(dropZone === data.key) {
      setGlobalPosition(position);
    }
  }, [dropZone, position]);

  const getBrothers = useMemo(() => {
    return memoize(current => {
      return Object.entries(__REFS__)
        .filter(([key, el]) => el && key !== current)
        .map(([key, el]) => el.getBoundingClientRect())
    });
  }, [__REFS__, currentDragging, dropZone]);

  const getIndex = useCallback((currentKey) => {
    const brothers = getBrothers(currentKey);

    if (!movement) return brothers.length;
    if (brothers.length === 0) return 0;

    const draggedTop = movement.y - currentDragging.offset.y;
    const draggedBottom = draggedTop + currentDragging.size.height;

    for (let i = 0; i < brothers.length; i++) {
      const rect = brothers[i];

      if (global.verticalDirection === UP) {
        if (draggedTop < (rect.y + (rect.height * 0.75))) return i;
      } else {
        if ((rect.y + (rect.height * 0.25)) > draggedBottom) return i;
      }
    }

    return brothers.length;
  }, [
    getBrothers,
    currentDragging,
    global.verticalDirection
  ]);

  useEffect(() => {
    if(!dragging || !draggingEvent || !movement) return
    if(!dropZone || dropZone !== data.key || position == null) return;
    if (!currentDragging || currentDragging.key == data?.key) return;

    const rect = draggingEvent;

    const { size } = currentDragging;
    const { height } = size;

    if (rect) {
      setElement(
        <div
          key={currentDragging.key}
          style={{ maxHeight: height }}
          className={`${currentDragging.className} pointer-events-none opacity-60 transition-all duration-200 ease-in border-2 border-dashed border-primary/70`}
          dangerouslySetInnerHTML={{ __html: currentDragging.ref?.innerHTML }}
        />,
        position
      );
    }
  }, [position, dropZone, data, currentDragging, dragging]);

  useEffect(() => {
    if(!dragging) return;

    if(dropZone && dropZone == data.key && currentDragging) {
      if (currentDragging.key === data.key) return;

      const i = getIndex(currentDragging.key);
      position !== i && setPosition(i);
    }
  }, [movement, dropZone, currentDragging]);

  const clearDragged = useCallback(() => {
    if(!dragging) return elements;
    
    return elements.filter(el =>
      el.$$typeof !== Symbol.for('react.transitional.element') &&
      (currentDragging ? el.data?.key !== currentDragging.key : true)
    );
  }, [elements, currentDragging, dragging, data.key]);

  const renderizableProps = loopar.utils.renderizableProps(props);

  const ClassNames = cn(
    "rounded bg-secondary/50 pt-4 h-full min-h-20 w-full p-2",
    dragOver ? 'bg-gradient-to-r from-slate-400/30 to-slate-600/60 shadow h-full' : "",
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

  if(designerMode && designerModeType != "preview" && !hidden) return (
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