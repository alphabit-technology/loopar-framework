import HTML from "$base-component";
import DragAndDropUtils from "$tools/drag-and-drop";
import elementManage from "$tools/element-manage";
import loopar from "$loopar";
import { BoxIcon } from "lucide-react";
import { useRef } from "react";

import { useDocument, useDesigner, HiddenContext, useDroppable } from "@custom-hooks";

export function DesignElement(props){
  const element = props.element;
  const Icon = props.icon || BoxIcon;
  const draggableRef = useRef();
  const {currentDragging, setCurrentDragging} = useDesigner();

  const elementToCreate = () => {
    const elementName = elementManage.elementName(this.toElement);

    return {
      element: this.toElement,
      data: {
        ...elementName,
        key: elementName.id
      },
      designer: true,
      hasTitle: true,
    }
  }

  const data = props.data || {}
  return (
    <a
      className="flex w-full flex-col items-center rounded-sm border bg-card p-2 text-card-foreground shadow cursor-pointer transition-colors hover:bg-muted/50"
      draggable="true"
      ref={draggableRef}
      onDragStart={(e) => {
        e.stopPropagation();

        const el = { 
          data: Object.assign({}, data), 
          element: props.element, 
          elements: props.elements
        };

        setCurrentDragging({
          el,
          key: data.key,
          ref: draggableRef.current,
          rect: e.target.getBoundingClientRect(),
          mousePosition: {x: e.clientX, y: e.clientY}
        });
        //DragAndDropUtils.elementToCreate = elementToCreate;
      }}
      /*onDragEnd={() => {
        DragAndDropUtils.elementToCreate = null;
      }}*/
    >
      <Icon className="h-8 w-8" />
      <small className="text-muted-foreground truncate text-center w-full">
        {loopar.utils.humanize(element.element)}
      </small>
    </a>
  )

  /*set toElement(element) {
    this.#toElement = element;
  }

  get toElement() {
    return this.props.element.element;
  }

  get elementToCreate() {
    const elementName = elementManage.elementName(this.toElement);

    return {
      element: this.toElement,
      data: {
        ...elementName,
        key: elementName.id
      },
      designer: true,
      hasTitle: true,
    }
  }*/
}