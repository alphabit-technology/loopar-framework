import { useDragAndDrop } from "./DragAndDropContext";
import { memo, useLayoutEffect } from 'react';

export const DragGhost = memo(function DragGhost() {
  const { ghostDomRef, draggingEventRef, currentDragging, dragging } = useDragAndDrop();

  // Position is updated continuously via direct DOM writes from
  // DragAndDropContext (no React state involved). This effect just
  // anchors the ghost on mount and when a new drag starts.
  useLayoutEffect(() => {
    const el = ghostDomRef?.current;
    const ev = draggingEventRef?.current;
    if (el && ev) {
      el.style.left = `${ev.x}px`;
      el.style.top = `${ev.y}px`;
    }
  }, [dragging, currentDragging?.key, ghostDomRef, draggingEventRef]);

  // `dragging` flips to true only after movement has been published at
  // least once, so the additional movement check the previous gate had is
  // redundant.
  if (!(dragging && currentDragging)) return null;

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
