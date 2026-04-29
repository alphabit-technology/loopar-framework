import {createContext, useContext, useCallback, useMemo, useRef} from "react";
import { useDragAndDrop } from "./DragAndDropContext";

export const DroppableContext = createContext({});

export const useDroppable = () => useContext(DroppableContext);

export const DroppableContextProvider = ({data, children, ...props }) => {
  const __REFS__ = useRef({}).current;
  const { 
    dropZone, setDropZone, 
    currentDragging, 
    handleDrop,
    dragging
  } = useDragAndDrop();

  const handleSetDropZone = useCallback((e) => {
    e.preventDefault();
    if(!currentDragging || currentDragging?.key === data.key) return;
    if(props.element == ROW && currentDragging.el.element != COL) return;

    setDropZone(data.key);
  }, [currentDragging, data.key, props.element, setDropZone]);

  const droppableEvents = useMemo(() => {
    if (!currentDragging) return {};
    return {
      onPointerEnter: handleSetDropZone,
      onPointerOver: handleSetDropZone,
      onPointerUp: handleDrop,
    };
  }, [currentDragging, handleSetDropZone, handleDrop]);

  const dragOver = useMemo(() => {
    return dragging && dropZone && dropZone === data.key &&
      (currentDragging && data.key !== currentDragging?.key)
  }, [dropZone, currentDragging, data.key, dragging]);

  const contextValue = useMemo(() => ({
    droppableEvents,
    droppable: true,
    dragOver,
    __REFS__,
  }), [droppableEvents, dragOver]);

  return (
    <DroppableContext.Provider value={contextValue}>
      {children}
    </DroppableContext.Provider>
  );
}