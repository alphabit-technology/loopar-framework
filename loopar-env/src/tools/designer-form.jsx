import Div from "#div"
import DesignElement from "#tools/design-elements";
import { elementsDefinition } from "#global/element-definition";
import loopar from "#loopar";

export default class DesignerFormClass extends Div {
   constructor(props) {
      super(props);
   }

   render() {
      return super.render([
         Object.keys(elementsDefinition).map((element) => {
            return (
               <div className="col">
                  <h5>{loopar.utils.Capitalize(element)} Elements</h5>
                  <div className="row">
                     {elementsDefinition[element].filter(el => el.show_in_design !== false).map((element) => {
                        return DesignElement({ element });
                     })}
                  </div>
               </div>
            )
         })
      ]);
   }
}