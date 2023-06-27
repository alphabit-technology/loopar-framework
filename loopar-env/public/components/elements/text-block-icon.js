import {image, div, h3, p} from "../elements.js";
import BaseTextBlock from "../base/base-text-block.js";
export default class TextBlockIcon extends BaseTextBlock {
   droppable=false;
   className="card shadow";
   constructor(props){
      super(props);
   }

   render(){
      const data = this.props.meta.data || {};
      const {label="Text Block", description, action} = data;

      return super.render([
         div({className: "card shadow"}, [
            div({className: "card-body p-4"}, [
               div({className: "d-sm-flex align-items-start text-center text-sm-left"}, [
                  image({src: action, className: "mr-sm-4 mb-3 mb-sm-0", width: "72"}),
                  div({className: "flex-fill"}, [
                     h3({className: "mt-0"}, label),
                     p({className: "text-muted font-size-lg"}, description)
                  ])
               ])
            ])
         ])
      ]);
   }
}