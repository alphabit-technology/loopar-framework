import elementManage from "@@tools/element-manage";
import loopar from "loopar";
import { BoxIcon } from "lucide-react";
import { useRef } from "react";
import { useDragAndDrop } from "../droppable/DragAndDropContext";
import Icon from "@icon";

export function DesignElement(props){
  const element = props.element;
  //const Icon = props.icon || BoxIcon;
  const draggableRef = useRef();
  const {setCurrentDragging, setInitializedDragging} = useDragAndDrop();
  const toElement =  element.element;

  const elementToCreate = () => {
    const elementName = elementManage.elementName(toElement);

    return {
      element: toElement,
      data: {
        ...elementName,
        key: elementName.key
      }
    }
  }

  const className = "w-full bg-card/70 rounded transition-colors";

  const dragStart = (e) => {
    const el = elementToCreate();
    const rect = draggableRef.current.getBoundingClientRect();
    setInitializedDragging(true);

    setCurrentDragging({
      isNew: true,
      key: el.data.key,
      el,
      ref: draggableRef.current,
      initialPosition: {
        x: e.clientX,
        y: e.clientY,
      },
      offset: {
        x: e.clientX - rect.x,
        y: e.clientY - rect.y,
      },
      size: {
        width: rect.width,
        height: rect.height,
      },
      className: className + " mb-4",
    });
  };

  return (
    <div 
      className={className}
      ref={draggableRef}
      onPointerDown={dragStart}
    >
      <a
        className="flex w-full flex-col items-center rounded border p-2 shadow cursor-pointer transition-colors hover:bg-muted/50"
      >
        <Icon data={{icon: element.icon}} className="w-8 h-8"/>
        <small className="text-muted-foreground truncate text-center w-full user-select-none">
          {loopar.utils.humanize(element.element)}
        </small>
      </a>
    </div>
  )
}