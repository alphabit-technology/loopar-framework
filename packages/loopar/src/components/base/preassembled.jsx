import { ComponentDefaults } from "./ComponentDefaults";
import {Droppable} from "@droppable";
import {useDesigner} from "@context/@/designer-context";
import { useEffect, useId } from "react";

export default function Preassembled(props) {
  const { setElements } = ComponentDefaults(props);
  const { designerMode } = useDesigner();
  
  const data = props.data || {};
  const id = useId();

  useEffect(() => {
    if(!designerMode) return;
    let counter = 0;

    if (!props.elements || props.elements?.length === 0) {
      const prepareElements = (elements) => {
        return elements.map(el => {
          counter ++;
          el.data ??= {};
          el.data.key ??= id + counter;

          if (el.elements?.length > 0) {
            el.elements = prepareElements(el.elements);
          }
          return el;
        });
      }

      setElements(prepareElements(props.defaultElements || []), null, false);
    }
  }, [data])

  return props.notDroppable ? <div {...props}>{props.children}</div> : <Droppable {...props}/>
}