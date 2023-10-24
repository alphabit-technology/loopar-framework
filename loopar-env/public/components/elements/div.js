import Component from "../base/component.js";

export default class Div extends Component {
   tagName = "div";
   constructor(props) {
      super(props);
   }

   render(content = null) {
      return super.render([
         this.props.children,
         content
      ]);
   }
}