export function DragGhost({target, current}) {
  if (!target || !current) return;

  return (
    <div
      className="fixed pointer-events-none"
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