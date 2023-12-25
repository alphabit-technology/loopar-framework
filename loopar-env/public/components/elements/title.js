import BaseText from "../base/base-text.js";
import {h2} from "../elements.js";

export default class Title extends BaseText {
   droppable = false;
   draggable = true
   constructor(props){
      super(props);
   }

   render(){
      const data = this.data;
      return super.render([
         h2({
            className: `display-${this.getSize()} enable-responsive-font-size mb-4 ${this.getAlign()}`,
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