import { HTML } from "/components/base/html.js";
import { elementTitle } from "/components/element-manage.js";
import { h1 } from "/components/elements.js";

export default class Element extends HTML {
   tagName = "div";
   droppable = true;
   draggable = true;
   constructor(props) {
      super(props);
   }

   render(content = null) {
      return super.render([
         this.options.has_title ? elementTitle(this) : null,
         content || this.state.children || this.props.children || [],
         h1(this.data.description || "Test")
      ]);
   }
}