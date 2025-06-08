import { useContext, createContext, useState, useEffect, useRef } from 'react';
import { DragGhost } from "./drag-ghost.jsx";
import { Droppable } from "@droppable";
import { createPortal } from 'react-dom';
import _ from 'lodash';

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

export const DragAndDropProvider = (props) => {
  const { metaComponents, data } = props;
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
    if(_.isEqual(elementsRef.current, elements)) return;

    elementsRef.current = elements;
    setElements(elements);
  }

  useEffect(() => {
    handleSetElements(metaComponents);
  }, [metaComponents]);

  // This function is called two times, the first time to set elements y Droppable Component (target)
  // and the second time to update elements in Original Container
  const proccess = useRef(0)
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
          return el;
        });
      };

      handleSetElements(updateE(selfElements));
    }

    proccess.current += 1;
    if(proccess.current === 2) {
      proccess.current = 0;
      setTimeout(() => {
        props.onDrop && props.onDrop(JSON.stringify(elementsRef.current));
      }, 0);
    }
  }

  useEffect(() => {
    if (draggingEvent && movement) {
      const scrollSpeed = 25;
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
      setDrop(currentDragging);
    }else{
      setCurrentDragging(null);
      setDropZone(null);
    }

    setDragging(false);
  }

  useEffect(() => {
    if(!currentDragging) return;
    
    const handleDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();

      if (!currentDragging || !initializedDragging) return;

      const rect = containerRef.current.getBoundingClientRect();

      const enoughMovement = (pixels = 30) => {
        return Math.abs(e.clientY - (movement?.y || 0)) > pixels || Math.abs(e.clientX - (movement?.x || 0)) > pixels;
      }

      const isNew = currentDragging.isNew;

      setDraggingEvent({
        x: e.clientX - (!isNew ? rect.left : 0),
        y: e.clientY - (!isNew ? rect.top : 0)
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

    const protectTouchEvent = (e) => {
      if (!draggingEvent) return;
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('touchstart', protectTouchEvent, { passive: false });
    window.addEventListener('pointermove', handleDragOver, { passive: false });
    window.addEventListener('pointerup', handleDrop, { passive: false });

    return () => {
      window.removeEventListener('touchstart', protectTouchEvent);
      window.removeEventListener('pointermove', handleDragOver);
      window.removeEventListener('pointerup', handleDrop);
    }
  }, [currentDragging, dropZone, initializedDragging, dragging]);

  useEffect(() => {
    document.body.style.userSelect = currentDragging ? 'none' : 'auto';

    return () => {
      document.body.style.userSelect = 'auto';
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
        {containerRef.current && createPortal(<DragGhost/>, containerRef.current)}
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