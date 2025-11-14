import {createContext, useContext, useState, useCallback, useMemo, useEffect} from "react";
import { useDragAndDrop } from "./DragAndDropContext";

export const DroppableContext = createContext({});

export const useDroppable = () => useContext(DroppableContext);

export const DroppableContextProvider = ({data, children, ...props }) => {
  const __REFS__ = {};
  const { 
    dropZone, setDropZone, 
    currentDragging, 
    movement,
    handleDrop,
    dragging
  } = useDragAndDrop();
  
  const droppableEvents = {};

  const handleSetDropZone = useCallback((e) => {
    e.preventDefault();
    if(!currentDragging || currentDragging?.key === data.key) return;
    if(props.element == ROW && currentDragging.el.element != COL) return;

    setDropZone(data.key);
  }, [currentDragging, data.key, props.element, movement]);

  if (currentDragging) {
    droppableEvents.onPointerEnter = handleSetDropZone;
    droppableEvents.onPointerOver = handleSetDropZone;
    droppableEvents.onPointerUp = handleDrop
  }

  const dragOver = useMemo(() => {
    return dragging && dropZone && dropZone === data.key &&
      (currentDragging && data.key !== currentDragging?.key)
  }, [dropZone, currentDragging, data.key, dragging]);

  return (
    <DroppableContext.Provider value={{
      droppableEvents,
      droppable: true,
      dragOver,
      __REFS__
    }}>
      {children}
    </DroppableContext.Provider>
  );
}