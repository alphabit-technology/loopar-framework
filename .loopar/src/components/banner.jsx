import Preassembled from "$preassembled";
import {cn} from "@/lib/utils";

export default function MetaBanner(props) {
  const data = props.data || {};

  const defaultElements = [
    {
      element: "title",
      data: {
        text: data?.label || "Banner Title...",
        size: "3xl",
        text_align: "center",
      },
    },
    {
      element: "subtitle",
      data: {
        text: data?.text || "Subtitle...",
        text_align: "center",
      },
    },
  ];

  const className = cn(props.className, "grid grid-cols-1 gap-4 place-content-center w-full h-full");
    
  return (
    <Preassembled
      {...props}
      defaultElements={defaultElements}
      className={className}
    />
  );
}

MetaBanner.designerClasses = "h-full w-full p-3 py-6";