import Preassembled from "@preassembled";
import {useId} from "react";

export default function TextBlockIcon(props) {
  const id = useId();

  const defaultElements = [
    {
      element: DIV,
      data: {
        key: id + "-container",
        class: "flex gap-2"
      },
      elements: [
        {
          element: DIV,
          data: {
            class: "flex w-[100px] h-full justify-center items-top rounded-3",
            key: id + "-wrapper",
          },
          elements: [
            {
              element: ICON,
              data: {
                class: "w-full",
                key: id + "-icon",
              }
            }
          ]
        },
        {
          element: DIV,
          data: {
            class: "w-full",
            key: id + "-content",
          },
          elements: [
            {
              element: TEXT_BLOCK
            }
          ]
        }
      ],
    }
  ];

  return (
    <Preassembled
      {...props}
      defaultElements={defaultElements}
    />
  );
}
