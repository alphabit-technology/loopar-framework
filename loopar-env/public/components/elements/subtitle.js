import BaseText from "../base/base-text.js";
import { h3 } from "../elements.js";

export default class SubTitle extends BaseText {
   droppable = false;
   draggable = true
   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         h3({
            className: `font-size-xl enable-responsive-font-size ${this.getAlign()}`,
            ...(
               this.props.designer ? {
                  style: {
                     maxHeight: "3em",
                     overflow: "auto",
                     display: "-webkit-box",
                     "-webkit-line-clamp": 5,
                     "-webkit-box-orient": "vertical",
                  }
               } : {}
            )
         }, this.getText())
      ]);
   }
}