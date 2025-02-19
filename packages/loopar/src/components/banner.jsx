import Preassembled from "@preassembled";
import { cn } from "@/lib/utils";

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

  const alling = {
    center: "justify-center items-center",
    start: "justify-start items-start",
    end: "justify-end items-end",
  }[data?.aling || "center"];
  
  return (
    <Preassembled
      {...props}
      defaultElements={defaultElements}
      className={`${className} ${alling}`}
    />
  );
}

MetaBanner.designerClasses = "h-full w-full p-3 py-6";

MetaBanner.metaFields =()=>{
  return [{
    group: "custom",
    elements: {
      alling: {
        element: SELECT,
        data: {
          options: ["center", "start", "end"],
        }
      }
    }
  }];
}