import {HTML} from "./html.js";

export class BaseDiv extends HTML {
   constructor(options) {
      super(options);
   }

   make() {
      super.div();
   }
}