/*import BaseDocument from "#looar/gui/document/base/base-document";
import { DeskGUI } from "#loopar/gui/document/base/desk-gui";
import { Element } from "#components/elements";*/

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