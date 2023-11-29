import Component from "../base/component.js";
import { div } from "/components/elements.js";

export default class Col extends Component {
   className = "col";
   //dontHaveContainer = true;
   blockComponent = true;
   dontHaveMetaElements = ["label", "text"];

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
      super.componentDidMount();
      this.props.designer && this.addClass("element draggable");
   }

   get metaFields() {
      const inputs = ["xm", "sm", "md", "lg", "xl"].map(size => {
         return {
            element: INPUT,
            data: {
               name: size,
               label: `col-${size}`,
               format: "number",
               min: 1, max: 12,
            }
         }
      });

      return [
         {
            group: 'general',
            elements: inputs.reduce((acc, input) => {
               acc[input.data.name] = input;
               return acc;
            }, {})
         }
      ]
   }
}

export const col = (options) => {
   return new Col(options);
}