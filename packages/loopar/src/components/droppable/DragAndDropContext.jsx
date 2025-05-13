import { useContext, createContext, useState, useEffect, useRef } from 'react';
import { DragGhost } from "./drag-ghost.jsx";
import { Droppable } from "@droppable";
import { createPortal } from 'react-dom';

export const DragAndDropContext = createContext({
  currentDropZone: null,
  setCurrentDropZone: () => { },
  currentDragging: null,
  setCurrentDragging: () => { },
  movement: null,
  setMovement: () => { },
  draggingEvent: null,
  setDraggingEvent: () => { },
  handleDrop: () => { },
  dragging: false,
  setDragging: () => { },
  drop: false,
  setDrop: () => { },
  setInitializedDragging: () => { }
});

export const DragAndDropProvider = ({data, metaComponents, ...props }) => {
  const [activeId] = useState(null);
  const [dropZone, setDropZone] = useState(null);
  const [currentDragging, setCurrentDragging] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(currentDragging?.targetRect);
  const [movement, setMovement] = useState(null);
  const [drop, setDrop] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [initializedDragging, setInitializedDragging] = useState(false);
  const [elements, setElements] = useState(metaComponents || []);
  const elementsRef = useRef(elements);

  const containerRef = useRef(null);

  const handleSetElements = (elements) => {
    setElements(elements);
    elementsRef.current = elements;
  }

  useEffect(() => {
    handleSetElements(metaComponents);
  }, [metaComponents]);

  const updateContainer = (key, updatedElements) => {
    if(!key) return;

    if(key === data.key) {
      // If the key is the same as the container, update the elements directly
      handleSetElements([...updatedElements]);
    }else{
      // If the key is different, find the element in the container and update it
      const selfElements = [...elementsRef.current];

      const updateE = (structure) => {
        return structure.map((el) => {
          if(!el.data) return el;
          if (el.data.key === key) {
            el.elements = updatedElements;
          } else {
            el.elements = updateE(el.elements || []);
          }
          return { element: el.element, data: el.data, elements: el.elements };
        });
      };

      handleSetElements(updateE(selfElements));
    }

    props.onDrop && props.onDrop(JSON.stringify(elementsRef.current));
  }

  useEffect(() => {
    if (draggingEvent && movement) {
      const scrollSpeed = 15;
      const scrollBuffer = 100;

      if (movement.y <= scrollBuffer) {
        window.scrollTo(0, window.scrollY - scrollSpeed);
      } else if (movement.y > window.innerHeight - scrollBuffer) {
        window.scrollBy(0, scrollSpeed);
      }
    }
  }, [draggingEvent]);

  const handleDrop = (e) => {
    setInitializedDragging(false);

    if(movement){
      setDrop(currentDragging)
    }else{
      setDragging(false);
      setCurrentDragging(null);
      setDropZone(null);
    }
  }

  useEffect(() => {
    if(!currentDragging) return;
    
    const handleDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!currentDragging || !initializedDragging) return;

      const rect = containerRef.current.getBoundingClientRect();

      const enoughMovement = (pixels = 30) => {
        return Math.abs(e.clientY - (movement?.y || 0)) > pixels;
      }

      setDraggingEvent({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });

      global.verticalDirection = e.clientY >= window.lastY ? 'down' : 'up';
      window.lastY = e.clientY;

      if (enoughMovement()) {
        !dragging && setDragging(true);
        setMovement({
          x: e.clientX,
          y: e.clientY,
        });
      }
    }

    window.addEventListener('pointermove', handleDragOver, { passive: false });
    window.addEventListener('pointerup', handleDrop, { passive: false });

    return () => {
      window.removeEventListener('pointermove', handleDragOver);
      window.removeEventListener('pointerup', handleDrop);
    }
  }, [dropZone, currentDragging, movement]);

  useEffect(() => {
    document.body.style.userSelect = currentDragging ? 'none' : 'auto';

    const protectTouchEvent = (e) => {
      if (!currentDragging) return;
      e.preventDefault();
      e.stopPropagation();
    };

    if (currentDragging) {
      document.body.addEventListener('touchstart', protectTouchEvent, { passive: false });
    }

    return () => {
      document.body.style.userSelect = 'auto';
      document.body.removeEventListener('touchstart', protectTouchEvent);
    };
  }, [currentDragging]);


  return (
    <DragAndDropContext.Provider
      value={{
        metaComponents,
        activeId,
        dropZone,
        setDropZone,
        currentDragging,
        setCurrentDragging,
        draggingEvent,
        movement,
        setMovement,
        handleDrop,
        dragging,
        drop,
        setDrop,
        setInitializedDragging,
        updateContainer,
        baseElements: elements
      }}
    >
      <div
        ref={containerRef}
        className="relative overflow-hidden"
      >
        {containerRef.current && createPortal(
        <DragGhost/>
        , containerRef.current)}
        <Droppable
          className="min-h-20 rounded p-4"
          elements={elements}
          data={{
            ...data,
            key: data.key,
          }}
        />
        {props.children}
      </div>
    </DragAndDropContext.Provider>
  )
}

export const useDragAndDrop = () => useContext(DragAndDropContext);