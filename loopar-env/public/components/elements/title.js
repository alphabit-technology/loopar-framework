import Div from "/components/elements/div.js";
import {h1, p} from "../elements.js";

export default class Title extends Div {
   droppable = false;
   defaultDescription = "This a user-friendly, simple and responsive Text Block.";
   constructor(props){
      super(props);
   }

   render(){
      const data = this.props.meta.data || {};
      const [label="Text Block", description=this.defaultDescription] =[data.label, data.description];

      return super.render([
         h1({className: "h1 mb-0"}, label),
         p({className: "text-muted font-size-lg mb-4"}, description)
      ]);
   }
}