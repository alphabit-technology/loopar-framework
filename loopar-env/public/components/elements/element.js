import {HTML} from "/components/base/html.js";
import {element_title} from "/components/element-manage.js";
import {h1} from "/components/elements.js";

export default class Element extends HTML {
   tag_name = "div";
   droppable = true;
   draggable = true;
   constructor(props) {
      super(props);
   }

   render(content=null) {
      return super.render([
         this.options.has_title ? element_title(this) : null,
         content || this.state.children || this.props.children || [],
         h1(this.data.description || "Test")
      ]);
   }
}