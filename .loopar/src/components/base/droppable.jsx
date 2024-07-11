import React, { useState, useEffect, useRef } from "react";
import { useDesigner, useHidden, DroppableContext } from "@custom-hooks";
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

    const newElements = elements.filter(el => el.$$typeof !== Symbol.for("react.element") && el.data.key !== current);

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
            style={{width: rect.width - 35, height: 50}}
            className="mb-4 bg-green-900/40 rounded-sm border-dashed border-secondary-500 transition-all duration-300 drop-shadow-sm p-4"
          />, position
        );
        return;
      }
    }
    setElements((elements || []).filter(el => el.$$typeof !== Symbol.for("react.element") &&  el.data && el.data?.key && el.data?.key !== currentDragging?.key));
    //setElements((elements || []).filter(el => el.data && el.data.key && el.data.key !== currentDragging?.key));
  }, [position, currentDragging, dropping]);

  useEffect(() => {
    if(!currentDragging){
      setElements(props.elements || []);
    }
  }, [props.elements]);

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
  
  useEffect(() => {
    setDropping(currentDropZone && currentDropZone === dropZoneRef.current);
  }, [currentDropZone, dropZoneRef]);

  useEffect(() => {
    if(dropped){
      designerRef.updateElements(
        {data: {key: data.key}}, //Target
        elements, //Elements
        {data: {key: currentDragging?.key}, parentKey: currentDragging?.parentKey}, //Source
      );

      setDropped(false);
      //setCurrentDragging(null);
      //setCurrentDropZone(null);
    }
  }, [dropped]);

  useEffect(() => {
    if(!currentDragging){
      setDropping(false);
    }
  }, [currentDragging, currentDropZone]);
  
  if (designerMode && isDroppable && designerModeType !== "preview") {
    droppableEvents.droppable = true;
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
    designerModeType !== "preview" && "bg-slate-200/50 dark:bg-slate-900/50 pt-4 h-full w-full p-2",
    dropping && designerModeType !== "preview" ? 'bg-gradient-to-r from-slate-400/30 to-slate-600/60 shadow transition-all duration-300 p-4 h-full' : '',
    className
  );

  const renderizableProps = loopar.utils.renderizableProps(props);
  const C = (designerMode && isDroppable && !hidden) ? "div" : Component === "fragment" ? React.Fragment : Component;

  const getCurrentDragKey = () => {
    return currentDragging?.key;
  }

  const getTargetRect = () => {
    return currentDragging?.targetRect || {};
  }

  const targetRect = getTargetRect();

  return (
    (designerMode && isDroppable && !hidden) ?
      <>
        {
          (currentDropZone && currentDragging && dropping && data.key && data.key !== getCurrentDragKey()) && (
            <div
              className="fixed bg-secondary rounded-md border-2 pointer-events-none"
              //key={getCurrentDragKey()+"-dragging"}
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