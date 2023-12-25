import Preassembled from "#preassembled"

export default class Banner extends Preassembled {
   className = "position-relative pb-5 d-block text-gray";
   style = {
      height: "100vh",
      width: "100%",
   };
   droppable = true;

   constructor(props) {
      super(props);
   }

   defaultElements = [
      {
         element: "div",
         data: {
            class: "container position-relative",
            style: "top: 30%;"
         },
         elements: [
            {
               element: "title",
               data: {
                  text: this.data?.label || "Banner Title...",
                  size: "xl",
                  text_align: "center"
               }
            },
            {
               element: "subtitle",
               data: {
                  text: this.data?.text || "Subtitle...",
                  text_align: "center"
               }
            }
         ]
      }
   ]

   render() {
      return super.render(
         <div
            className="position-relative pb-5 d-block text-gray"
            style={{
               height: "100vh",
               width: "100%",
            }}
         />
      )
   }
}