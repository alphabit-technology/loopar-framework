import BaseDocument from "./base/base-document.js";
import {DeskGUI} from "./base/desk-gui.js";
import {Element} from "/components/elements.js";

export default class View extends BaseDocument {
   has_sidebar = true;
   has_header = true;
   constructor(props) {
      super(props);
   }

   render(content){
      return super.render([
         DeskGUI({
            meta: this.meta,
            ref: gui => this.gui = gui,
            has_sidebar: this.has_sidebar,
            has_header: this.has_header,
            base: this
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