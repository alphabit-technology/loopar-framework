import { HTML } from "/components/base/html.js";
import { DragAndDropUtils } from "/tools/drag-and-drop.js";
import { a, i } from "/components/elements.js";
import { elementManage } from "./element-manage.js";
import { loopar } from "/loopar.js";

export class DesignElementClass extends HTML {
   #toElement = null;
   tagName = "div";

   className = "btn-app-container";
   constructor(props) {
      super(props);
   }

   render() {
      const element = this.props.element;

      return super.render([
         a({
            className: "btn btn-app",
            draggable: true,
            onDragStart: (event) => {
               event.stopPropagation();
               DragAndDropUtils.elementToCreate = this.elementToCreate;
            },
            onDragEnd: () => {
               DragAndDropUtils.elementToCreate = null;
            }
         }, [
            i({ className: element.icon }),
            loopar.utils.humanize(element.element)
         ])
      ])
   }

   set toElement(element) {
      this.#toElement = element;
   }

   get toElement() {
      return this.props.element.element;
   }

   get elementToCreate() {/*Return element to set in drag*/
      const element_name = elementManage.elementName(this.toElement);

      return {
         element: this.toElement,
         data: {
            name: element_name.name,
            id: element_name.id,
            label: element_name.label,
         },
         key: element_name.id,
         designer: true,
         has_title: true,
      }
   }
}

export const DesignElement = (props = {}, content = []) => {
   return React.createElement(DesignElementClass, props, content);
}