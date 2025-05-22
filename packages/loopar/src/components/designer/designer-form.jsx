import {DesignElement} from "./design-element";
import { elementsDefinition } from "@global/element-definition";
import loopar from "loopar";
import * as Icons from "lucide-react";
import {useId} from "react";

export function DesignerForm() {
  const id = useId();
  return (
    <>
      {Object.keys(elementsDefinition).map((element) => {
        return (
          <div className="pt-5">
            <h2 className="text-2xl pt-3">{loopar.utils.Capitalize(element)} Elements</h2>
            <div className="grid grid-cols-3 gap-1" key={`${id}-${element}`}>
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