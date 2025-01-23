import { Droppable } from "@droppable";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@/lib/utils";
import {useRowContext} from "./row/RowContext"

export default function Col(props) {
  const { designerMode, designing } = useDesigner();
  const { colPadding } = useRowContext();

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
// Col.metaFields = () => {
//   const inputs = ["xm", "sm", "md", "lg", "xl"].map((size) => {
//     return {
//       element: INPUT,
//       data: {
//         name: size,
//         label: `col-${size}`,
//         format: "number",
//         min: 1,
//         max: 12,
//       },
//     };
//   });

//   return [[
//     {
//       group: "general",
//       elements: inputs.reduce((acc, input) => {
//         acc[input.data.name] = input;
//         return acc;
//       }, {}),
//     },
//   ]];
// }