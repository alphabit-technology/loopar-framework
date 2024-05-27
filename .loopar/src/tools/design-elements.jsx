import HTML from "$base-component";
import DragAndDropUtils from "$tools/drag-and-drop";
import elementManage from "$tools/element-manage";
import loopar from "$loopar";
import { BoxIcon } from "lucide-react";

export default class DesignElement extends HTML {
  #toElement = null;
  constructor(props) {
    super(props);
  }

  render() {
    const element = this.props.element;
    const Icon = this.props.icon || BoxIcon;

    return (
      <a
        className="flex w-full flex-col items-center rounded-sm border bg-card p-2 text-card-foreground shadow cursor-pointer transition-colors hover:bg-muted/50"
        draggable="true"
        onDragStart={(event) => {
          event.stopPropagation();
          DragAndDropUtils.elementToCreate = this.elementToCreate;
        }}
        onDragEnd={() => {
          DragAndDropUtils.elementToCreate = null;
        }}
      >
        <Icon className="h-8 w-8" />
        <small className="text-muted-foreground truncate text-center w-full">
          {loopar.utils.humanize(element.element)}
        </small>
      </a>
    )
  }

  set toElement(element) {
    this.#toElement = element;
  }

  get toElement() {
    return this.props.element.element;
  }

  get elementToCreate() {
    /*Return element to set in drag*/
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
}