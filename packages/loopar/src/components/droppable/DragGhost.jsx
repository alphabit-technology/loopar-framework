import { useDragAndDrop } from "./DragAndDropContext";
import { memo, useLayoutEffect } from 'react';

export const DragGhost = memo(function DragGhost() {
  const { ghostDomRef, draggingEventRef, currentDragging, containerRef } = useDragAndDrop();

  useLayoutEffect(() => {
    const el = ghostDomRef?.current;

    if (!currentDragging) {
      draggingEventRef.current = null;
      return;
    }

    const ip = currentDragging.initialPosition;
    if (ip && containerRef?.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const isNew = currentDragging.isNew;
      draggingEventRef.current = {
        x: ip.x - (!isNew ? rect.left : 0),
        y: ip.y - (!isNew ? rect.top : 0),
      };
    }

    const ev = draggingEventRef.current;
    if (el && ev) {
      el.style.left = `${ev.x}px`;
      el.style.top = `${ev.y}px`;
    }
  }, [currentDragging?.node, ghostDomRef, draggingEventRef, containerRef]);

  if (!currentDragging) return null;

  const { size, offset } = currentDragging;
  const isNew = currentDragging.isNew;

  return (
    <div
      ref={ghostDomRef}
      className={`pointer-events-none ${isNew ? 'fixed' : 'absolute'}`}
      style={{
        ...size,
        transform: `translate(-${offset.x}px, -${offset.y}px)`,
        transition: "none",
        zIndex: 9999,
      }}
    >
      <div
        className={currentDragging.className}
        dangerouslySetInnerHTML={{ __html: currentDragging?.ref?.innerHTML }}
      />
    </div>
  );
});
