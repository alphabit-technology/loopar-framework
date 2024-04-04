import Component from "$component";

export default class DivComponent extends Component {
   tagName = "div";

   render(content = null) {
      return super.render([
         this.props.children,
         content
      ]);
   }
}