 import Component from "../base/component.js";

export default class Div extends Component {
   tag_name = "div";
   constructor(props) {
      super(props);
   }

   render(content=null) {
      return super.render([
         this.props.children,
         content
      ]);
   }
}