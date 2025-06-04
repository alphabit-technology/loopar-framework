import { useDragAndDrop } from "./DragAndDropContext";
import { memo } from 'react';

export const DragGhost = memo(function DragGhost() {
  const { draggingEvent, movement, currentDragging, dragging } = useDragAndDrop();

  if (!draggingEvent || !dragging || !movement || !currentDragging) return null;

  const { size, offset } = currentDragging;

  const isNew = currentDragging.isNew;

  return (
    <div
      className={`pointer-events-none ${isNew ? 'fixed' : 'absolute'}`}
      style={{
        top: draggingEvent.y,
        left: draggingEvent.x,
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