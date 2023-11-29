import BaseText from "../base/base-text.js";
import { p } from "../elements.js";

export default class Paragraph extends BaseText {
   droppable = false;
   draggable = true
   
   constructor(props) {
      super(props);
   }

   render() {
      this.tagName = this.props.designer ? "div" : "p";

      return super.render([
         p({ className: `text-muted font-size-lg mb-4 ${this.getAlign()}` }, this.getText())
      ]);
   }
}