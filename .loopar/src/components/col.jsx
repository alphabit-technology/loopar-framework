import { Droppable } from "@droppable";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@/lib/utils";
import {useRowContext} from "./row/RowContext"

export default function Col(props) {
  const { designerMode, designing } = useDesigner();
  const { colPadding } = useRowContext();

  const data = props.data || {};
  if(data.name == "test")
  console.log("Col", props);

  const className = cn((!designerMode || !designing) && colPadding, props.className, 'h-full', props.data?.class);
  return (
    <Droppable
      {...props}
      className={className}
    />
  );
}

Col.dontHaveMetaElements = ["label", "text"];
Col.droppable = true;