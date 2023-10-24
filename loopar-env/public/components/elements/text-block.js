import {h3, p} from "../elements.js";
import BaseTextBlock from "../base/base-text-block.js";

export default class TextBlock extends BaseTextBlock {
   droppable = false;

   constructor(props){
      super(props);
   }

   render(){
      const data = this.props.meta.data || {};
      const [label="Text Block", description=this.defaultDescription] =[data.label, data.description];

      return super.render([
         h3({className: "h3 mb-4"}, label),
         p({className: "text-muted font-size-lg mb-4"}, description)
      ]);
   }
}