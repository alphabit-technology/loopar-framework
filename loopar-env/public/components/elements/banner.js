import {image, div, h1, h3, p} from "../elements.js";
import BaseTextBlock from "../base/base-text-block.js";

export default class Banner extends BaseTextBlock {
   className = "position-relative pb-5 bg-light";
   defaultDescription = "This is a simple hero unit, a simple jumbotron-style component for calling extra attention to featured content or information.";
   style = {
      height: "100vh"
   };
   constructor(props){
      super(props);
   }

   render(){
      const {label, description, action, color_overlay={}} = this.props.meta.data;
      const children = this.props.children;
      const {color, alpha} = color_overlay;

      return super.render([
         div({
            className: "sticker",
            style: {
               backgroundColor: color || "rgba(0,0,0,0.5)",
               opacity: alpha || 0.5
            }
         }),
         div({className: "container position-relative", style: {
            top: "30%",
            //backgroundColor: "rgba(255,255,255,0.5)", test to see if this works
         }}, [
            h1({ className: "display-4 enable-responsive-font-size mb-4 text-center"}, label),
            h3({ className: "text-muted font-size-xl enable-responsive-font-size  text-center"}, [
               description,
               children
            ]),
         ])
      ])
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
   }
}