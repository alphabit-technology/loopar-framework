import Div from "/components/elements/div.js";
import Component from "../base/component.js";
import { div } from "/components/elements.js";

export default class Panel extends Component {
   blockComponent = true;
   className = "card card-fluid";
   constructor(props) {
      super(props);
   }

   render(content) {
      return super.render([
         div({
            Component: this,
            ref: el => this.container = el,
            className: "card-body element sub-element show"
         }, [
            this.props.children,
            content,
            ...this.elements
         ])
      ]);
   }
}