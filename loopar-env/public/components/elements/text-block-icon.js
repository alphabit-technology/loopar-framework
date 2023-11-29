import {image, div, h3, p} from "../elements.js";
import BaseTextBlock from "../base/base-textblock.js";

export default class TextBlockIcon extends BaseTextBlock {
   droppable=false;
   className="card shadow";
   dontHaveBackground=true;

   constructor(props){
      super(props);
   }

   render(){
      const data = this.props.meta.data || {};
      const {label="Text Block", text} = data;

      return super.render([
         div({className: "card shadow"}, [
            div({className: "card-body p-4"}, [
               div({className: "d-sm-flex align-items-start text-center text-sm-left"}, [
                  image({ src: ((this.getSrc() || [])[0] || {}).src, className: "mr-sm-4 mb-3 mb-sm-0", width: "72"}),
                  div({className: "flex-fill"}, [
                     h3({className: "mt-0"}, label),
                     p({className: "text-muted font-size-lg"}, text)
                  ])
               ])
            ])
         ])
      ]);
   }
}

/*import { image, div, h3, p } from "../elements.js";
import Preassembled from "../base/preassembled.js";

export default class TextBlockIcon extends Preassembled {
   blockComponent = true;
   droppable = true;
   className = "card shadow";
   dontHaveBackground = true;

   defaultElements = [
      {
         element: "image",
         data: {
            src: "https://preview.webpixels.io/purpose-website-ui-kit-v1.0.1/assets/img/illustrations/illustration-3.png",
            class: "mr-sm-4 mb-3 mb-sm-0",
            width: "72"
         }
      },
      {
         element: "div",
         data: {
            class: "flex-fill"
         },
         elements: [
            {
               element: "subtitle",
               data: {
                  class: "mt-0",
                  text: "Text Block"
               }
            },
            {
               element: "paragraph",
               data: {
                  class: "text-muted font-size-lg",
                  text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante."
               }
            }
         ]
      }
   ]

   render(content) {
      const data = this.props.meta.data || {};
      const { label = "Text Block", text } = data;

      return super.render([
         div({ className: "card shadow" }, [
            div({ className: "card-body p-4" }, [
               div({
                  Component: this,
                  ref: el => this.container = el,
                  className: "d-sm-flex align-items-start text-center text-sm-left element sub-element" 
               }, [
                  this.props.children,
                  content,
                  this.elements
                  //image({ src: ((this.getSrc() || [])[0] || {}).src, className: "mr-sm-4 mb-3 mb-sm-0", width: "72" }),
                  //div({ className: "flex-fill" }, [
                  //   h3({ className: "mt-0" }, label),
                  //   p({ className: "text-muted font-size-lg" }, text)
                  //])
               ])
            ])
         ])
      ]);
   }
}*/