import { div, button, span, Banner } from "../elements.js";
import { loopar } from "/loopar.js";
import { elementManage } from "../element-manage.js";
import BaseCarrusel from "../base/base-carrusel.js";

export default class Galery extends BaseCarrusel {
   defaultElements = [
      {
         element: "image",
         data: {
            color_overlay: "rgba(0,0,0,0.3)",
            background_image: "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM",
         }
      },
      {
         element: "image",
         data: {
            color_overlay: "rgba(0,0,0,0.3)",
            background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
         }
      }
   ];

   constructor(props) {
      super(props);
   }

   addImage() {
      const id = elementManage.uuid();

      const newSlide = {
         element: "image",
         data: {
            key: `slider_${id}`,
            background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
            color_overlay: "rgba(0,0,0,0.3)"
         },
      };

      this.setElements([newSlide], () => {
         this.showSlide(this.sliderCount() - 1);
      });
   }
}