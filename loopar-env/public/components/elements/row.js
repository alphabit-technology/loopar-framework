import { div } from "../elements.js";
import Component from "../base/component.js";

export default class Row extends Component {
   blockComponent = true;
   className = "row";
   constructor(props) {
      super(props);
   }

   render(content) {
      return super.render([
         this.props.children,
         content,
         this.elements
      ]);
   }

   componentDidMount() {
      super.componentDidMount();

      /*if(this.options.designer){
         this.container.droppable_actions();
      }else{
         //this.addClass("position-relative pb-5 bg-light");
      }*/
   }
}