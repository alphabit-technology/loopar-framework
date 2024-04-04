import Preassembled from "$preassembled";
import { v4 as uuidv4 } from "uuid";

export default class TextBlock extends Preassembled {
  droppable = true;
  defaultElements = [
    {
      element: "subtitle",
      data: {
        class: "font-bold text-2xl mb-2",
        text: "Text Block",
        name: uuidv4(),
      }
    },
    {
      element: "paragraph",
      data: {
        class: "text-muted font-size-lg mb-4",
        text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante.",
        name: uuidv4(),
      },
    },
  ];
}
