import Component from "../base/component.js";
import { div } from "/components/elements.js";

export default class Col extends Component {
   className = "col";
   blockComponent = true;
   constructor(props) {
      super(props);
   }

   render(content = null) {
      return super.render([
         this.props.children,
         content,
         ...this.elements
      ]);
   }

   componentDidMount() {
      super.componentDidMount()

      const data = this.data || {};
      const { size = "md", col = 6 } = data;
      this.props.designer && this.addClass("element draggable");
      this.addClass(`col-${col * 2} col-${size}-${col}`);
   }
}

export const col = (options) => {
   return new Col(options);
}