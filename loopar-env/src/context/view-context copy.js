/*import BaseDocument from "./base/base-document.js";
import { DeskGUI } from "./base/desk-gui.js";
import { Element } from "/components/elements.js";*/

/*export default class View extends BaseDocument {
   hasSidebar = true;
   hasHeader = true;
   hasHistory = true;

   constructor(props) {
      super(props);
   }

   render(content) {
      return super.render([
         DeskGUI({
            docRef: this
         }, [
            ...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
               if (el.data.hidden) return null;
               return Element(el.element, {
                  meta: {
                     ...el,
                  },
               })
            }),
            content
         ])
      ]);
   }
}*/