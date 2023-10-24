import BaseDocument from "./base/base-document.js";
import {Element} from "/components/elements.js";

export default class View extends BaseDocument {
   constructor(props) {
      super(props);
   }

   render(content=[]) {
      return super.render([
         ...this.meta.__DOCTYPE__.STRUCTURE.map(el => {
            if (el.data.hidden) return null;
            return Element(el.element, {
               docRef: this,
               meta: {
                  ...el,
               },
            })
         }),
         content
      ]);
   }
}