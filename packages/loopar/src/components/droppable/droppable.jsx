import React, { useState, useEffect, useRef, use } from "react";
import { useHidden } from "@context/@/hidden-context";
import { DroppableContext } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import loopar from "loopar";
import MetaComponent from "@meta-component";
const UP = 'up';
import _ from "lodash";

export function Droppable({ data = {}, children, className, Component = "div", ...props }) {
  const [dropping, setDropping] = useState(false);
  const [dropped, setDropped] = useState(false);
  const hidden = useHidden();

  const __REFS__ = {}
  const [elements, setElements] = useState(props.elements || []);
  const [movement, setMovement] = useState();
  const [position, setPosition] = useState();
  const { currentDropZone, setCurrentDropZone, currentDragging, designerMode, designerModeType, designerRef, setDraggingPosition } = useDesigner();

  const isDroppable = true;
  const droppableEvents = {};
  const dropZoneRef = useRef();
  const prevElements = useRef(props.elements);

  const handleSetElements = (elements) => {
    if (!_.isEqual(prevElements.current, elements)) {
      setElements(elements);
      prevElements.current = elements;
    }
  }

  const setElement = (element, afterAt, current) => {
    current = currentDragging?.key;

    const newElements = elements.filter(el => el.data && el.data.key && el.data.key !== current);
    element && newElements.splice(afterAt, 0, element);

    handleSetElements(newElements);
  };

  const getBrothers = (current) => {
    return Object.keys(__REFS__).filter(e => e !== current).map(key => __REFS__[key]?.getBoundingClientRect());
  }

  const findInsertIndex = (current, currentKey) => {
    const brothers = getBrothers(currentKey);
    if (!movement) return brothers.length;

    if (!current) return;
    if (brothers.length === 0) return 0;

    for (let i = 0; i < brothers.length; i++) {
      const rect = brothers[i];

      if (!rect) return;

      if (verticalDirection === UP) {
        if (movement.y < rect.y + rect.height / 2) return i;
      } else {
        if(i === brothers.length - 1) return brothers.length;
        if (movement.y < rect.y + (rect.height*3)) return i + 1;
      }
    }

    return brothers.length;
  }

  useEffect(() => {
    if (currentDragging) {
      const currentKey = currentDragging.key;
      if (!currentKey || currentKey === data.key) return;

      const i = findInsertIndex(currentDragging.targetRect, currentKey);
      position !== i && setPosition(i);
    }

    if (movement) {
      window.verticalDirection = movement.y >= window.lastY ? 'down' : 'up';
      window.lastY = movement.y;

      const scrollSpeed = 15;
      const scrollBuffer = 100;

      if (movement.y <= scrollBuffer) {
        window.scrollTo(0, window.scrollY - scrollSpeed);
      } else if (movement.y > window.innerHeight - scrollBuffer) {
        window.scrollBy(0, scrollSpeed);
      }
    }
  }, [movement]);

  useEffect(() => {
    if (currentDragging) {
      const rect = currentDragging.targetRect;

      if (currentDropZone && currentDropZone === dropZoneRef.current && rect) {
        const timeout = setTimeout(() => {
          setElement(
            <div
              style={{ maxHeight: rect.height, opacity: 0.5, pointerEvents: 'none' }}
              className={`${currentDragging?.className}`} 
              dangerouslySetInnerHTML={{ __html: currentDragging?.ref?.innerHTML }}
            />,
            position
          );
        }, 10);

        return () => clearTimeout(timeout);
      }
    }
  }, [position, currentDragging, currentDropZone]);

  useEffect(() => {
    if (!dropping) {
      handleSetElements((elements || []).filter(el => el.$$typeof !== Symbol.for('react.transitional.element')));
    }
  }, [dropping]);

  /**TODO: Check optimization on render */
  useEffect(() => {
    if (!currentDragging) {
      handleSetElements(props.elements || []);
    }
  }, [props.elements]);
  /**TODO: Check optimization on render */

  useEffect(() => {
    setDropping(currentDropZone && currentDropZone === dropZoneRef.current && (currentDragging && data.key !== currentDragging?.key));
  }, [currentDropZone, dropZoneRef, currentDragging]);

  useEffect(() => {
    if (dropped) {
      setElement(currentDragging.el, position, currentDragging?.key);
      setDraggingPosition(null);

      designerRef.updateElements(
        { data: { key: data.key } }, //Target
        elements, //Elements
        { data: { key: currentDragging?.key }, parentKey: currentDragging?.parentKey }, //Source
      );
    }
  }, [dropped]);

  useEffect(() => {
    if (dropped) {
      setDropped(false);
      setDropping(false);
    }
  }, [dropped, elements, props.elements]);

  if (designerMode && isDroppable && designerModeType !== "preview" && data.key !== currentDragging?.key) {
    droppableEvents.droppable = "true";
    droppableEvents.onDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if(currentDragging?.key === data.key) return;
      if(props.element == ROW && currentDragging.el.element != COL) return;

      setCurrentDropZone(dropZoneRef.current);
    };
    droppableEvents.onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if(currentDragging?.key === data.key || (props.element == ROW && currentDragging.el.element != COL)){
        setDraggingPosition(null);
        return;
      }

      if (currentDragging?.el) {
        setElement(currentDragging.el, position, currentDragging?.key)
        setDropped(true);
      }
    };
    droppableEvents.onDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!currentDragging || currentDragging.ref === dropZoneRef.current) return;

      const rect = currentDragging.rect;
      const mouse = currentDragging.mousePosition;

      const enoughMovement = (pixels = 1) => {
        return Math.abs(e.clientX - movement.x) > pixels || Math.abs(e.clientY - movement.y) > pixels;
      }

      if (!movement || enoughMovement()) {
        const r = {
          x: rect.x - (mouse.x - e.clientX),
          y: rect.y - (mouse.y - e.clientY),
          width: rect.width,
          height: rect.height,
          dataTrasfer: e.dataTransfer,
        }

        currentDragging.targetRect = r;

        setMovement({ x: e.clientX, y: e.clientY });
        
        setDraggingPosition(r);
      }
    };
  }

  const renderizableProps = loopar.utils.renderizableProps(props);
  const C = (designerMode && isDroppable && !hidden) ? "div" : Component === "fragment" ? React.Fragment : Component;

  const ClassNames = cn(
    designerModeType !== "preview" && "rounded bg-secondary/50 pt-4 h-full min-h-20 w-full p-2",
    dropping && designerModeType !== "preview" ? 'bg-gradient-to-r from-slate-400/30 to-slate-600/60 shadow p-4 h-full' : '',
    className,
    renderizableProps.className
  );

  return (
    (designerMode && isDroppable && !hidden) ?
      <>
        <C
          {...(C.toString() == 'Symbol(react.fragment)' ? {} : {
            ...renderizableProps,
            className: ClassNames,
            ...droppableEvents,
            ref: dropZoneRef
          })}
        >
          {children}
          <DroppableContext.Provider value={{ droppable: isDroppable, setDroppable: () => { }, __REFS__ }}>
            <MetaComponent
              elements={elements}
              parentKey={data.key}
            />
          </DroppableContext.Provider>
        </C>
      </>
      :
      <C {...(C.toString() == 'Symbol(react.fragment)' ? {} : { ...renderizableProps, className: className })}>
        {children} <MetaComponent elements={elements} parentKey={data.key} />
      </C>
  );
}