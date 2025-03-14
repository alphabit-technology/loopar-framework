export function DragGhost({position, dragging}) {
  if (!position || !dragging) return;
  
  return (
    <div
      className="fixed pointer-events-none"
      key={dragging.key + "-ghost"}
      style={{
        width: position.width,
        height: position.height,
        top: position.y,
        left: position.x,
        zIndex: 100,
      }}
    >
      <div className={dragging.className} dangerouslySetInnerHTML={{__html: dragging?.ref?.innerHTML}}/> 
    </div>
  )
}