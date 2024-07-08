import {DesignElement} from "$tools/design-element";
import { elementsDefinition } from "$global/element-definition";
import loopar from "$loopar";
import * as Icons from "lucide-react";

export function DesignerForm() {
  return (
    <>
      {Object.keys(elementsDefinition).map((element) => {
        return (
          <div>
            <h1 className="text-xl pt-3">{loopar.utils.Capitalize(element)} Elements</h1>
            <div className="grid grid-cols-3 gap-1">
              {elementsDefinition[element].filter(el => el.show_in_design !== false).map((element) => {
                return <DesignElement element={element} icon={Icons[element.icon]}/>;
              })}
            </div>
          </div>
        )
      })}
    </>
  );
}