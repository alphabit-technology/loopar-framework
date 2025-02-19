import Preassembled from "@preassembled";
import { useId } from "react";

export default function TextBlock(props) {
  const id = useId();
  const defaultElements = [
    {
      element: "subtitle",
      data: {
        class: "font-bold text-2xl mb-2",
        text: "Text Block",
        name: id + "-title",
        //key: id + "-title",
      }
    },
    {
      element: "paragraph",
      data: {
        class: "text-muted font-size-lg mb-4",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.",
        name: id + "-paragraph",
        //key: id + "-paragraph",
      },
    },
  ];

  return (
    <Preassembled
      {...props}
      defaultElements={defaultElements}
    />
  );
}
