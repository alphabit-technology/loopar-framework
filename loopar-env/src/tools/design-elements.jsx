import HTML from "#base-component";
import DragAndDropUtils from "#tools/drag-and-drop";
import elementManage from "#tools/element-manage";
import loopar from "#loopar";

export default class DesignElementClass extends HTML {
   #toElement = null;
   tagName = "div";

   className = "btn-app-container";
   constructor(props) {
      super(props);
   }

   render() {
      const element = this.props.element;

      return super.render(
         <a
            className="btn btn-app"
            draggable="true"
            onDragStart={(event) => {
               event.stopPropagation();
               DragAndDropUtils.elementToCreate = this.elementToCreate;
            }}
            onDragEnd={() => {
               DragAndDropUtils.elementToCreate = null;
            }}
         >
            <i className={element.icon}></i>
            {loopar.utils.humanize(element.element)}
         </a>
      )
   }

   set toElement(element) {
      this.#toElement = element;
   }

   get toElement() {
      return this.props.element.element;
   }

   get elementToCreate() {/*Return element to set in drag*/
      const elementName = elementManage.elementName(this.toElement);

      return {
         element: this.toElement,
         data: {
            name: elementName.name,
            id: elementName.id,
            label: elementName.label,
            key: elementName.id
         },
         //key: elementName.id,
         designer: true,
         hasTitle: true,
      }
   }
}