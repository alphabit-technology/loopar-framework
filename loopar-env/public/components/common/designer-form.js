import {div, h5} from "/components/elements.js";
import Div from "../elements/div.js";
import {DesignElement} from "../design-elements.js";
import {elements_definition} from "/element-definition.js";
import {Capitalize} from "/tools/helper.js";

export class DesignerFormClass extends Div {
   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         Object.keys(elements_definition).map((element) => {
            return (
               div({className: "col"}, [
               h5(Capitalize(element) + " Elements"),
                  div({className: "row"}, [
                     elements_definition[element].filter(el => el.show_in_design !== false).map((element) => {
                        return DesignElement({element});
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