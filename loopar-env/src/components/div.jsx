import Component from "#component";

export default class DivComponent extends Component {
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