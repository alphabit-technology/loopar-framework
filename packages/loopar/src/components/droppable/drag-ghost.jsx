export function DragGhost({target, parent, current}) {
  if (!target || !current || parent === current.key) return;
  
  return (
    <div
      className="fixed pointer-events-none"
      key={current.key + "-ghost"}
      style={{
        width: target.width,
        height: target.height,
        top: target.y,
        left: target.x,
        zIndex: 100,
      }}
    >
      <div className={current.className} dangerouslySetInnerHTML={{__html: current?.ref?.innerHTML}}/> 
    </div>
  )
}