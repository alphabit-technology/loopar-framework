import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useHidden } from "@context/@/hidden-context";
import { DroppableContext } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import loopar from "loopar";
import MetaComponent from "@meta-component";
import { useDragAndDrop } from "./DragAndDropContext";
const UP = 'up';
import _ from "lodash";
import memoize from 'lodash.memoize';

function DroppableContainer({ data = {}, children, className, Component = "div", ...props }) {
  const __REFS__ = {}
  const [elements, setElements] = useState(props.elements || []);
  const [position, setPosition] = useState(null);

  useEffect(() => {
    setElements(props.elements || []);
  }, [props.elements]);

  const { 
    dropZone, setDropZone, 
    currentDragging, setCurrentDragging, 
    movement, setMovement,
    draggingEvent,
    handleDrop,
    dragging,
    drop,
    setDrop,
    updateContainer
  } = useDragAndDrop();

  const droppableEvents = {};
  const dropZoneRef = useRef();
  const prevElements = useRef(props.elements);

  const dropping = useMemo(() => {
    return dragging && dropZone && dropZone === data.key &&
      (currentDragging && data.key !== currentDragging?.key)
  }, [dropZone, currentDragging, data.key, dragging]);

  const handleSetElements = (elements) => {
    setElements(elements);
    prevElements.current = elements;
  }

  const setElement = (element, afterAt, current) => {
    current = currentDragging?.key;

    const newElements = [...elements].filter(el => {
      const key = el.data?.key;
      return key && key != current;
    });

    element && newElements.splice(afterAt, 0, element);

    handleSetElements(newElements);
  };

  const getBrothers = useMemo(() => {
    return memoize(current => {
      return Object
        .keys(__REFS__)
        .filter(e => e !== current)
        .reduce((acc, key) => {
          const el = __REFS__[key];
          if (el) {
            const rect = el.getBoundingClientRect();
            acc[key] =  rect
          }
          return acc;
        }, {})
    });
  }, [__REFS__, currentDragging]);

  const getIndex = useCallback((currentKey) => {
    const brothers = Object.values(getBrothers(currentKey));
    if (!movement) return brothers.length;

    if (brothers.length === 0) return 0;

    for (let i = 0; i < brothers.length; i++) {
      const rect = brothers[i];

      if (verticalDirection === UP) {
        if((movement.y - rect.height) < rect.y) return i; 
      } else {
        if(rect.y > movement.y) return i;
      }
    }

    return brothers.length;
  }, [
    getBrothers,
    currentDragging,
    global.verticalDirection
  ]);

  useEffect(() => {
    if(!movement) return;
    if(!dropZone || dropZone !== data.key || position == null) return;
    if (!currentDragging || currentDragging.key === data?.key) return;

    const rect = draggingEvent;

    const { size } = currentDragging;
    const { height } = size;

    if (rect) {
      setElement(
        <div
          key={currentDragging.key}
          style={{ maxHeight: height}}
          className={`${currentDragging.className} pointer-events-none opacity-60 transition-all duration-200 ease-in border-2 border-dashed border-primary/70`} 
          dangerouslySetInnerHTML={{ __html: currentDragging.ref?.innerHTML }}
        />,
        position
      );
    }
  }, [position, dropZone, currentDragging, movement]);

  useEffect(() => {
    if(!dragging) return;

    if(dropZone && dropZone == data.key && currentDragging) {
      if (currentDragging.key === data.key) return;

      const i = getIndex(currentDragging.key);
      position !== i && setPosition(i);
    }
  }, [movement, dropZone, currentDragging]);

  const filterDragged = useCallback(() => elements.filter(el =>
    el.data?.key !== currentDragging?.key
  ), [elements, currentDragging]);

  const clearDragged = useCallback(() => elements.filter(el =>
    el.$$typeof !== Symbol.for('react.transitional.element')
  ), [elements]);

  useEffect(() => {
    if (drop) {
      if (dropZone === data.key) {
        setDropZone(null);
        setElement(drop.el, position, drop.key);
        updateContainer(data.key, prevElements.current);
      }else if(currentDragging && currentDragging?.parentKey === data.key){
        handleSetElements(filterDragged());
        updateContainer(data.key, prevElements.current);
      }

      setCurrentDragging(null);
      setMovement(null);
      setDrop(null);
      setPosition(null);
    }
  }, [drop]);

  useEffect(() => {
    if(!dragging) return;
    if(dropZone && dropZone != data.key){
      setTimeout(() => {
        handleSetElements(clearDragged());
      }, 10);
    }
  }, [dropZone, position]);

  const handleSetDropZone = useCallback(() => {
    if(!currentDragging || currentDragging?.key === data.key) return;
    if(props.element == ROW && currentDragging.el.element != COL) return;

    setDropZone(data.key);
  }, [currentDragging, data.key, props.element, movement]);

  if (currentDragging) {
    droppableEvents.onPointerEnter = handleSetDropZone;
    droppableEvents.onPointerOver = handleSetDropZone;
    droppableEvents.onPointerUp = handleDrop
  }

  const renderizableProps = loopar.utils.renderizableProps(props);

  const ClassNames = cn(
    "rounded bg-secondary/50 pt-4 h-full min-h-20 w-full p-2",
    dropping ? 'bg-gradient-to-r from-slate-400/30 to-slate-600/60 shadow h-full' : "",
    className,
    renderizableProps.className,
    //"transition-all duration-100 ease-in-out",
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
      <DroppableContext.Provider value={{__REFS__ }}>
        <MetaComponent
          elements={elements}
          parentKey={data.key}
        />
      </DroppableContext.Provider>
    </div>
  );
}

export function Droppable(props) {
  const {data = {}, children, className, elements, Component = "div"} = props;
  const { designerMode, designerModeType } = useDesigner();
  const hidden = useHidden();
  const renderizableProps = loopar.utils.renderizableProps(props);
  const C = (designerMode && hidden) ? "div" : Component === "fragment" ? React.Fragment : Component;

  if(designerMode && designerModeType != "preview" && !hidden) return <DroppableContainer {...props} />

  return (
    <C {...(C.toString() == 'Symbol(react.fragment)' ? {} : { ...renderizableProps, className: className })}>
      {children} <MetaComponent elements={elements} parentKey={data.key} />
    </C>
  );
}