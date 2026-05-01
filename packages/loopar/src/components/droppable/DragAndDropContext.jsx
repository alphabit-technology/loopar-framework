import { useContext, createContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DragGhost } from "./DragGhost.jsx";
import { Droppable } from "@droppable";
import { createPortal } from 'react-dom';
import { isEqual } from 'es-toolkit/predicate';
const DOWN = 'down';
const UP = 'up';
// Pixels the cursor must travel before we publish a new `movement` value.
// Each publish triggers a context-level re-render across every droppable, so
// raising this dramatically reduces React work on large pages. The ghost
// itself moves smoothly via direct DOM writes, so a coarser movement state
// is invisible to the user. Tune with care: too high and the placeholder
// feels draggy.
const MOVEMENT_THRESHOLD = 30;

export function completeDrop({ elements, targetKey, dropped, globalPosition }) {
  // Both `insert` and `remove` are pure (no input mutation: only `splice`
  // runs on a fresh array from .filter()). They also preserve structural
  // sharing — branches that don't contain the changed node return their
  // original reference. This is critical for React reconciliation: only
  // components on the path from root to the modified parent will re-render.
  function insert(nodes) {
    let changed = false;
    const result = nodes.map(node => {
      if (!node.data) return node;

      if (node.data.key === targetKey) {
        const filtered = (node.elements || []).filter(
          child => child.data.key !== dropped.el.data.key
        );
        filtered.splice(globalPosition, 0, dropped.el);
        changed = true;
        return { ...node, elements: filtered };
      }

      const children = node.elements;
      if (!children || children.length === 0) return node;

      const newChildren = insert(children);
      if (newChildren === children) return node;

      changed = true;
      return { ...node, elements: newChildren };
    });
    return changed ? result : nodes;
  }

  function remove(nodes) {
    let changed = false;
    const result = nodes.map(node => {
      if (!node.data) return node;

      if (node.data.key === dropped.parentKey && dropped.parentKey !== targetKey) {
        const filtered = (node.elements || []).filter(
          child => child.data.key !== dropped.key
        );
        changed = true;
        return { ...node, elements: filtered };
      }

      const children = node.elements;
      if (!children || children.length === 0) return node;

      const newChildren = remove(children);
      if (newChildren === children) return node;

      changed = true;
      return { ...node, elements: newChildren };
    });
    return changed ? result : nodes;
  }

  return remove(insert(elements));
}

export const DragAndDropContext = createContext({
  currentDragging: null,
  setCurrentDragging: () => { },
  movementRef: { current: null },
  subscribeToMovement: () => () => { },
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
  setGlobalPosition: () => { },
  verticalDirectionRef: { current: DOWN },
  ghostDomRef: { current: null },
  draggingEventRef: { current: null },
});

export const DragAndDropProvider = (props) => {
  const { metaComponents, data, onDrop } = props;
  const [dropZone, setDropZone] = useState(null);
  const [currentDragging, setCurrentDragging] = useState(null);
  const [draggingEvent, setDraggingEvent] = useState(currentDragging?.targetRect);
  const [dragging, setDragging] = useState(false);
  const [initializedDragging, setInitializedDragging] = useState(false);
  const [elements, setElements] = useState(metaComponents || []);
  const [globalPosition, setGlobalPosition] = useState(null);
  const [, setPortalHost] = useState(0);

  const elementsRef = useRef(elements);
  const containerRef = useRef(null);
  const verticalDirectionRef = useRef(DOWN);
  // movement is held in a ref + pub/sub instead of React state. Publishing it
  // through context state caused every droppable on the page to re-render on
  // every cursor movement, blowing up the main thread on large pages. Now
  // only the active droppable subscribes and reacts.
  const movementRef = useRef(null);
  const movementSubscribersRef = useRef(new Set());
  const draggingRef = useRef(dragging);
  const draggingEventRef = useRef(draggingEvent);
  const initializedDraggingRef = useRef(initializedDragging);
  const currentDraggingRef = useRef(currentDragging);
  const dropZoneRef = useRef(dropZone);
  const globalPositionRef = useRef(globalPosition);
  const pointerFlushRafRef = useRef(0);
  const pendingPointerRef = useRef(null);
  const ghostDomRef = useRef(null);

  elementsRef.current = elements;
  draggingRef.current = dragging;
  draggingEventRef.current = draggingEvent;
  initializedDraggingRef.current = initializedDragging;
  currentDraggingRef.current = currentDragging;
  dropZoneRef.current = dropZone;
  globalPositionRef.current = globalPosition;

  const subscribeToMovement = useCallback((cb) => {
    movementSubscribersRef.current.add(cb);
    return () => {
      movementSubscribersRef.current.delete(cb);
    };
  }, []);

  const publishMovement = useCallback((next) => {
    movementRef.current = next;
    const subs = movementSubscribersRef.current;
    if (subs.size === 0) return;
    subs.forEach(cb => cb(next));
  }, []);

  const handleSetElements = useCallback((next) => {
    if(isEqual(elementsRef.current, next)) return;

    elementsRef.current = next;
    setElements(next);
  }, []);

  useEffect(() => {
    handleSetElements(metaComponents);
  }, [metaComponents, handleSetElements]);

  const handleCompleteDrop = useCallback((target, dropped) => {
    const gp = globalPositionRef.current;
    const newElements = completeDrop({
      elements: [{
        data,
        elements: elementsRef.current || []
      }],
      targetKey: target,
      dropped,
      globalPosition: gp,
    })[0].elements || [];

    setDragging(false);
    // Pass the object directly. Stringify+parse round-trip on the whole
    // tree was a measurable contributor to drop latency on large pages.
    onDrop?.(newElements);
    handleSetElements(newElements);
  }, [data, onDrop, handleSetElements]);

  const flushPendingPointerSync = useCallback(() => {
    if (pointerFlushRafRef.current) {
      cancelAnimationFrame(pointerFlushRafRef.current);
      pointerFlushRafRef.current = 0;
    }
    const p = pendingPointerRef.current;
    pendingPointerRef.current = null;
    if (!p || !containerRef.current) return;
    const cd = currentDraggingRef.current;
    if (!cd) return;
    const rect = containerRef.current.getBoundingClientRect();
    const isNew = cd.isNew;
    const nextEvent = {
      x: p.clientX - (!isNew ? rect.left : 0),
      y: p.clientY - (!isNew ? rect.top : 0),
    };
    const mv = movementRef.current;
    const crossed =
      Math.abs(p.clientY - (mv?.y || 0)) > MOVEMENT_THRESHOLD ||
      Math.abs(p.clientX - (mv?.x || 0)) > MOVEMENT_THRESHOLD;
    setDraggingEvent(nextEvent);
    draggingEventRef.current = nextEvent;
    const host = ghostDomRef.current;
    if (host) {
      host.style.left = `${nextEvent.x}px`;
      host.style.top = `${nextEvent.y}px`;
    }
    if (crossed) {
      if (!draggingRef.current) setDragging(true);
      publishMovement({ x: p.clientX, y: p.clientY });
    }
  }, [publishMovement]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    flushPendingPointerSync();

    const mv = movementRef.current;
    const dz = dropZoneRef.current;
    const cd = currentDraggingRef.current;

    setInitializedDragging(false);
    setDropZone(null);
    setCurrentDragging(null);

    mv && handleCompleteDrop(dz, cd);
    publishMovement(null);
  }, [handleCompleteDrop, flushPendingPointerSync, publishMovement]);

  useEffect(() => {
    if(!currentDragging) return;

    const applyGhostPosition = (clientX, clientY) => {
      const cd = currentDraggingRef.current;
      if (!cd || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const isNew = cd.isNew;
      const nextEvent = {
        x: clientX - (!isNew ? rect.left : 0),
        y: clientY - (!isNew ? rect.top : 0),
      };
      draggingEventRef.current = nextEvent;
      const host = ghostDomRef.current;
      if (host) {
        host.style.left = `${nextEvent.x}px`;
        host.style.top = `${nextEvent.y}px`;
      }
    };

    /** preventDefault on pointermove blocks native scrolling; scroll window explicitly from raw clientY */
    const autoScrollFromPointer = (clientY) => {
      const cd = currentDraggingRef.current;
      if (!cd) return;
      const scrollSpeed = 10;
      const scrollBuffer = 50;
      const draggedTop = clientY - cd.offset.y;
      const draggedBottom = draggedTop + cd.size.height;
      const dir = verticalDirectionRef.current;

      if (dir === UP && draggedTop <= scrollBuffer) {
        window.scrollTo(0, window.scrollY - scrollSpeed);
      } else if (dir === DOWN && draggedBottom > window.innerHeight - scrollBuffer) {
        window.scrollBy(0, scrollSpeed);
      }
    };

    const flushPointerFrame = () => {
      pointerFlushRafRef.current = 0;
      const p = pendingPointerRef.current;
      if (!p || !containerRef.current) return;
      const cd = currentDraggingRef.current;
      if (!cd) return;

      applyGhostPosition(p.clientX, p.clientY);
      autoScrollFromPointer(p.clientY);

      const mv = movementRef.current;
      const enough =
        Math.abs(p.clientY - (mv?.y || 0)) > MOVEMENT_THRESHOLD ||
        Math.abs(p.clientX - (mv?.x || 0)) > MOVEMENT_THRESHOLD;

      if (enough) {
        if (!draggingRef.current) setDragging(true);
        const nextMovement = { x: p.clientX, y: p.clientY };
        const prev = movementRef.current;
        if (!prev || prev.x !== nextMovement.x || prev.y !== nextMovement.y) {
          publishMovement(nextMovement);
        }
      }
    };

    const handleDragOver = (e) => {
      e.stopPropagation();
      e.preventDefault();

      const cd = currentDraggingRef.current;
      const init = initializedDraggingRef.current;

      if (!cd || !init) return;

      pendingPointerRef.current = { clientX: e.clientX, clientY: e.clientY };

      // Hysteresis on vertical direction: only update when Y has moved more
      // than DIRECTION_HYSTERESIS_PX since the last anchor. Without this, the
      // 1-3px Y jitter that happens during horizontal motion (e.g. dragging
      // col → col) flips direction on every pointermove, which in turn flips
      // the asymmetric thresholds in getIndex and makes the placeholder
      // oscillate between two slots ("fight for a position").
      const DIRECTION_HYSTERESIS_PX = 4;
      const prevAnchorY = window.lastY;
      if (typeof prevAnchorY !== 'number' || Number.isNaN(prevAnchorY)) {
        // First sample of this drag — anchor without flipping direction.
        window.lastY = e.clientY;
      } else {
        const yDelta = e.clientY - prevAnchorY;
        if (Math.abs(yDelta) > DIRECTION_HYSTERESIS_PX) {
          const dir = yDelta < 0 ? UP : DOWN;
          verticalDirectionRef.current = dir;
          global.verticalDirection = dir;
          window.lastY = e.clientY;
        }
        // Below threshold: keep previous direction, don't move the anchor —
        // that way successive sub-threshold moves accumulate into a real
        // delta instead of getting absorbed.
      }

      applyGhostPosition(e.clientX, e.clientY);
      // autoScrollFromPointer is intentionally NOT called here — it's invoked
      // once per frame inside flushPointerFrame. Calling it both sync and in
      // rAF doubled the scroll speed, which made the brothers' rects drift
      // between getIndex calls and the placeholder ended up one slot ahead.

      if (!pointerFlushRafRef.current) {
        pointerFlushRafRef.current = requestAnimationFrame(flushPointerFrame);
      }
    }

    const protectTouchEvent = (e) => {
      if (!draggingEventRef.current) return;
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('touchstart', protectTouchEvent, { passive: false });
    window.addEventListener('pointermove', handleDragOver, { passive: false });
    window.addEventListener('pointerup', handleDrop, { passive: false });

    return () => {
      if (pointerFlushRafRef.current) {
        cancelAnimationFrame(pointerFlushRafRef.current);
        pointerFlushRafRef.current = 0;
      }
      pendingPointerRef.current = null;
      window.lastY = undefined;
      verticalDirectionRef.current = DOWN;
      window.removeEventListener('touchstart', protectTouchEvent);
      window.removeEventListener('pointermove', handleDragOver);
      window.removeEventListener('pointerup', handleDrop);
    }
  }, [currentDragging, handleDrop]);

  useEffect(() => {
    document.body.style.userSelect = currentDragging ? 'none' : 'auto';
    document.body.style.cursor = currentDragging ? 'grabbing' : 'auto';
    return () => {
      document.body.style.userSelect = 'auto';
      document.body.style.cursor = 'auto';
    };
  }, [currentDragging]);

  const setContainerRef = useCallback((node) => {
    containerRef.current = node;
    setPortalHost((n) => (node ? n + 1 : n));
  }, []);

  const contextValue = useMemo(() => ({
    metaComponents,
    dropZone,
    setDropZone,
    currentDragging,
    setCurrentDragging,
    draggingEvent,
    movementRef,
    subscribeToMovement,
    handleDrop,
    dragging,
    setDragging,
    setInitializedDragging,
    baseElements: elements,
    setGlobalPosition,
    containerRef,
    verticalDirectionRef,
    ghostDomRef,
    draggingEventRef,
  }), [
    metaComponents,
    dropZone,
    currentDragging,
    draggingEvent,
    dragging,
    elements,
    handleDrop,
    subscribeToMovement,
  ]);

  return (
    <DragAndDropContext.Provider value={contextValue}>
      <div
        ref={setContainerRef}
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