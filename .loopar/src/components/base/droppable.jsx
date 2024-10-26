import React, { useState, useEffect, useRef } from "react";
import { useHidden } from "@context/@/hidden-context";
import { DroppableContext } from "@context/@/droppable-context";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@/lib/utils";
import loopar from "$loopar";
import MetaComponent from "@meta-component";

export function Droppable({data={}, children, className, Component="div", ...props}) {
  const [dropping, setDropping] = useState(false);
  const [dropped, setDropped] = useState(false);
  const hidden = useHidden();

  const __REFS__ = {}
  const [elements, setElements] = useState(props.elements || []);
  const [movement, setMovement] = useState();
  const [position, setPosition] = useState();
  const {currentDropZone, setCurrentDropZone, currentDragging, setCurrentDragging, designerMode, designerModeType, designerRef} = useDesigner();

  //const isDesigner = designerMode || props.isDesigner;
  const isDroppable = true// receiver.droppable || receiver.props.droppable || props.isDroppable;
  const droppableEvents = {};
  const dropZoneRef = useRef();

  const setElement = (element, afterAt, current) => {
    current = currentDragging?.key;

    const newElements = elements.filter(el => el.data && el.data.key && el.data.key !== current);

    element && newElements.splice(afterAt, 0, element);

    setElements(newElements);
  };

  const getBrothers = (current) => {
    return Object.keys(__REFS__).filter(e => e !== current).map(key => __REFS__[key].getBoundingClientRect());
  }

  const findInsertIndex = (current, currentKey) => {
    const brothers = getBrothers(currentKey);
    if(!movement) return brothers.length;

    if(!current) return;
    if(brothers.length === 0) return 0;

    for (let i = 0; i < brothers.length; i++) {
      const rect = brothers[i];

      if(verticalDirection === UP){
        if(movement.y < rect.y + rect.height / 2) return i;
      }else{
        if(movement.y < rect.y + rect.height) return i + 1;
      }
    }

    return brothers.length;
  }

  useEffect(() => {
    if(currentDragging){
      const currentKey = currentDragging.key;
      if(!currentKey || currentKey === data.key) return;

      const i = findInsertIndex(currentDragging.targetRect, currentKey);
      position !== i && setPosition(i);
    }
  }, [movement]);

  useEffect(() => {
    if(typeof position != "undefined" && currentDragging){
      
      const rect = currentDragging.targetRect;

      if(currentDropZone && currentDropZone === dropZoneRef.current && rect){
        setElement(
          <div
            style={{maxHeight: rect.height}}
            className="mb-4 rounded transition-all duration-300 shadow-sm shadow-red-500/50 p-4 w-full h-20"
          />, position
        );
        return;
      }
    }

    setElements((elements || []).filter(el => el.$$typeof !== Symbol.for('react.element') && ((el.data?.key || null) !== (currentDragging?.key))));
  }, [position, currentDragging, currentDropZone]);

  useEffect(() => {
    if(movement){
      const scrollSpeed = 15;
      const scrollBuffer = 100;

      if (movement.y <= scrollBuffer) {
        window.scrollTo(0, window.scrollY - scrollSpeed);
      } else if (movement.y > window.innerHeight - scrollBuffer) {
        window.scrollBy(0, scrollSpeed);
      }
    }
  }, [movement]);
  
  /**TODO: Check optimization on render */
  useEffect(() => {
    if(!currentDragging){
      setElements(props.elements || []);
    }
  }, [props.elements]);
   /**TODO: Check optimization on render */
  
  useEffect(() => {
    setDropping(currentDropZone && currentDropZone === dropZoneRef.current);
  }, [currentDropZone, dropZoneRef]);

  useEffect(() => {
    if(dropped){
      setElement(currentDragging.el, position, currentDragging?.key);

      designerRef.updateElements(
        {data: {key: data.key}}, //Target
        elements, //Elements
        {data: {key: currentDragging?.key}, parentKey: currentDragging?.parentKey}, //Source
      );
    }
  }, [dropped]);

  useEffect(() => {
    if(dropped){
      setDropped(false);
      setDropping(false);
    }
  }, [dropped, elements, props.elements]);
  
  if (designerMode && isDroppable && designerModeType !== "preview") {
    droppableEvents.droppable = "true";
    droppableEvents.onDragEnter = (e) => {
      e.preventDefault();
      e.stopPropagation();
      setCurrentDropZone(dropZoneRef.current);
    };
    droppableEvents.onDrop = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if(currentDragging?.el){
        setElement(currentDragging.el, position, currentDragging?.key);
        setDropped(true);
      }
    };
    droppableEvents.onDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if(!currentDragging) return;

      if(currentDragging.ref === dropZoneRef.current) return;

      const rect = currentDragging.rect;
      const mouse = currentDragging.mousePosition;

      const enoughMovement = (pixels=1) => {
        return Math.abs(e.clientX - movement.x) > pixels || Math.abs(e.clientY - movement.y) > pixels;
      }

      if(!movement || enoughMovement()){
        setMovement({x: e.clientX, y: e.clientY});
        currentDragging.targetRect = {
          x: rect.x - (mouse.x - e.clientX),
          y: rect.y - (mouse.y - e.clientY),
          width: rect.width,
          height: rect.height,
          dataTrasfer: e.dataTransfer,
        }
      }
    };
  }

  const ClassNames = cn(
    //mode !== "preview" && "h-full w-full p-3 bg-slate-200/50 dark:bg-red-500/50 pt-4" + isDroppable ? " min-h-20" : "",
    designerModeType !== "preview" && "rounded bg-secondary/50 pt-4 h-full min-h-20 w-full p-2",
    dropping && designerModeType !== "preview" ? 'bg-gradient-to-r from-slate-400/30 to-slate-600/60 shadow transition-all duration-300 p-4 h-full' : '',
    className
  );

  const renderizableProps = loopar.utils.renderizableProps(props);
  const C = (designerMode && isDroppable && !hidden) ? "div" : Component === "fragment" ? React.Fragment : Component;

  /*const getCurrentDragKey = () => {
    return currentDragging?.key;
  }*/

  const getTargetRect = () => {
    return currentDragging?.targetRect || {};
  }

  const targetRect = getTargetRect();

  return (
    (designerMode && isDroppable && !hidden) ?
      <>
        {
          (dropping && currentDropZone && currentDropZone === dropZoneRef.current && currentDragging && !currentDragging.new) && (
            <div
              className="fixed rounded border-2 pointer-events-none"
              style={{
                width: targetRect.width,
                height: targetRect.height,
                top: targetRect.y,
                left: targetRect.x,
                zIndex: 100,
              }}
            >
              <div className="p-2" dangerouslySetInnerHTML={{__html: currentDragging?.ref?.innerHTML}}></div> 
            </div>
          )
        }
        <C
          {...renderizableProps}
          className={ClassNames}
          {...droppableEvents}
          ref={dropZoneRef}
        >
          {children}
          <DroppableContext.Provider value={{droppable: isDroppable, setDroppable: () => {}, __REFS__}}>
            <MetaComponent
              elements={elements}
              parentKey={data.key}
            />
          </DroppableContext.Provider>
        </C>
      </>
        :
      <C {...(C.toString() === 'Symbol(react.fragment)' ? {} : {...renderizableProps, className: className})}>
        {children || <MetaComponent elements={elements} parentKey={data.key} />}
      </C>
  );
}