import { useContext, createContext, useState, useEffect, useRef } from 'react';
import { DragGhost } from "./drag-ghost.jsx";
import { Droppable } from "@droppable";
import { createPortal } from 'react-dom';
import _ from 'lodash';

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
  const [globalPosition, setGlobalPosition] = useState(null);

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

    handleSetElements(newElements);
    props.onDrop?.(JSON.stringify(newElements));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInitializedDragging(false);
    movement && handleCompleteDrop(dropZone, currentDragging);
    setMovement(null);
    setDragging(false);
    setDropZone(null);
    setCurrentDragging(null);
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
        dragging, setDragging,
        drop,
        setDrop,
        setInitializedDragging,
        baseElements: elements,
        setGlobalPosition
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