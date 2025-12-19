import { useContext, createContext, useState, useEffect, useRef } from 'react';
import { DragGhost } from "./DragGhost.jsx";
import { Droppable } from "@droppable";
import { createPortal } from 'react-dom';
import { isEqual } from 'es-toolkit/predicate';
const DOWN = 'down';
const UP = 'up';

export function completeDrop({ elements, targetKey, dropped, globalPosition }) {
  const cloned = JSON.parse(JSON.stringify(elements));

  function insert(nodes) {
    return nodes.map(node => {
      if (!node.data) return node;

      if (node.data.key === targetKey) {
        const filtered = (node.elements || []).filter(
          child => child.data.key !== dropped.el.data.key
        );
        filtered.splice(globalPosition, 0, dropped.el);
        return { ...node, elements: filtered };
      }

      return {
        ...node,
        elements: insert(node.elements || [])
      };
    });
  }

  function remove(nodes) {
    return nodes.reduce((acc, node) => {
      if (!node.data) {
        acc.push(node);
        return acc;
      }

      if (node.data.key === dropped.parentKey && dropped.parentKey !== targetKey) {
        const filtered = (node.elements || []).filter(
          child => child.data.key !== dropped.key
        );
        acc.push({ ...node, elements: filtered });
      } else {
        acc.push({
          ...node,
          elements: remove(node.elements || [])
        });
      }

      return acc;
    }, []);
  }

  return remove(insert(cloned));
}

export const DragAndDropContext = createContext({
  currentDragging: null,
  setCurrentDragging: () => { },
  movement: null,
  setMovement: () => { },
  draggingEvent: null,
  setDraggingEvent: () => { },
  handleDrop: () => { },
  dragging: false,
  setDragging: () => { },
  initializedDragging: false,
  setInitializedDragging: () => { },
  dropZone: null,
  setDropZone: () => { },
  baseElements: [],
  setGlobalPosition: () => { }
});

export const DragAndDropProvider = (props) => {
  const { metaComponents, data } = props;
  const [dropZone, setDropZone] = useState(null);
  const [currentDragging, setCurrentDragging] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(currentDragging?.targetRect);
  const [movement, setMovement] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [initializedDragging, setInitializedDragging] = useState(false);
  const [elements, setElements] = useState(metaComponents || []);
  const [globalPosition, setGlobalPosition] = useState(null);

  const elementsRef = useRef(elements);
  const containerRef = useRef(null);

  const handleSetElements = (elements) => {
    if(isEqual(elementsRef.current, elements)) return;

    elementsRef.current = elements;
    setElements(elements);
  }

  useEffect(() => {
    handleSetElements(metaComponents);
  }, [metaComponents]);

  useEffect(() => {
    if (draggingEvent && movement && currentDragging) {
      const scrollSpeed = 10;
      const scrollBuffer = 50;

      const draggedTop = movement.y - currentDragging.offset.y;
      const draggedBottom = draggedTop + currentDragging.size.height;

      if (global.verticalDirection === UP && draggedTop <= scrollBuffer) {
        window.scrollTo(0, window.scrollY - scrollSpeed);
      } else if (global.verticalDirection === DOWN && draggedBottom > window.innerHeight - scrollBuffer) {
        window.scrollBy(0, scrollSpeed);
      }
    }
  }, [draggingEvent, global.verticalDirection]);

  const handleCompleteDrop = (target, dropped) => {
    const newElements = completeDrop({
      elements: [{
        data,
        elements: elementsRef.current || []
      }],
      targetKey: target,
      dropped,
      globalPosition,
    })[0].elements || [];

    setDragging(false);
    props.onDrop?.(JSON.stringify(newElements));
    handleSetElements(newElements);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setInitializedDragging(false);
    setDropZone(null);
    setCurrentDragging(null);

    movement && handleCompleteDrop(dropZone, currentDragging);
    setMovement(null);
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
    document.body.style.cursor = currentDragging ? 'grabbing' : 'auto';
    return () => {
      document.body.style.userSelect = 'auto';
      document.body.style.cursor = 'auto';
    };
  }, [currentDragging]);

  return (
    <DragAndDropContext.Provider
      value={{
        metaComponents,
        dropZone,
        setDropZone,
        currentDragging,
        setCurrentDragging,
        draggingEvent,
        movement,
        setMovement,
        handleDrop,
        dragging, setDragging,
        setInitializedDragging,
        baseElements: elements,
        setGlobalPosition,
        containerRef
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