import BaseDocument from "./base/base-document.js";
import { DeskGUI } from "./base/desk-gui.js";
import { Element } from "/components/elements.js";

export default class View extends BaseDocument {
   hasSidebar = true;
   has_header = true;
   constructor(props) {
      super(props);
   }

   render(content) {
      return super.render([
         DeskGUI({
            meta: this.meta,
            hasSidebar: this.hasSidebar,
            has_header: this.has_header,
            docRef: this,
         }, [
            ...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
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
}