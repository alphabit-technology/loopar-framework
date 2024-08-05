import elementManage from "$tools/element-manage";
import loopar from "$loopar";
import { BoxIcon } from "lucide-react";
import { useRef } from "react";

import { useDesigner } from "@context/@/designer-context";

export function DesignElement(props){
  const element = props.element;
  const Icon = props.icon || BoxIcon;
  const draggableRef = useRef();
  const {setCurrentDragging} = useDesigner();

  const toElement =  element.element;

  const elementToCreate = () => {
    const elementName = elementManage.elementName(toElement);

    return {
      element: toElement,
      data: {
        ...elementName,
        key: elementName.id
      },
      designer: true,
      hasTitle: true,
    }
  }

  return (
    <a
      className="flex w-full flex-col items-center rounded-sm border bg-card p-2 text-card-foreground shadow cursor-pointer transition-colors hover:bg-muted/50"
      draggable="true"
      ref={draggableRef}
      onDragStart={(e) => {
        e.stopPropagation();
        const el = elementToCreate();

        setCurrentDragging({
          el,
          key: el.data.key,
          ref: draggableRef.current,
          rect: e.target.getBoundingClientRect(),
          mousePosition: {x: e.clientX, y: e.clientY},
          new:true
        });
      }}
    >
      <Icon className="h-8 w-8" />
      <small className="text-muted-foreground truncate text-center w-full">
        {loopar.utils.humanize(element.element)}
      </small>
    </a>
  )
}