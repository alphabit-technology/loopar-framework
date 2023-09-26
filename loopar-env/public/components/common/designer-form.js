import { div, h5 } from "/components/elements.js";
import Div from "../elements/div.js";
import { DesignElement } from "../design-elements.js";
import { elementsDefinition } from "/element-definition.js";
import { loopar } from "/loopar.js";

export class DesignerFormClass extends Div {
   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         Object.keys(elementsDefinition).map((element) => {
            return (
               div({ className: "col" }, [
                  h5(loopar.utils.Capitalize(element) + " Elements"),
                  div({ className: "row" }, [
                     elementsDefinition[element].filter(el => el.show_in_design !== false).map((element) => {
                        return DesignElement({ element });
                     })
                  ])
               ])
            )
         })
      ]);
   }
}

export const DesignerForm = (props, content) => {
   return React.createElement(DesignerFormClass, props, content);
}