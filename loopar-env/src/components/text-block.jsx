import Preassembled from "#preassembled";

export default class TextBlock extends Preassembled {
   droppable = true;
   defaultElements = [
      {
         element: "subtitle"
      },
      {
         element: "paragraph",
         data: {
            class: "text-muted font-size-lg mb-4",
            text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer posuere erat a ante."
         }
      }
   ]
}