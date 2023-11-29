import {div, button, span, Banner, Image} from "../elements.js";
import { loopar } from "/loopar.js";
import { elementManage } from "../element-manage.js";
import BaseCarrusel from "../base/base-carrusel.js";

export default class Carrusel extends BaseCarrusel {
   defaultElements = [
      {
         element: "banner",
         data: {
            text: "Slide 1",
            color_overlay: "rgba(0,0,0,0.3)",
            background_image: "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM",
            key: elementManage.uuid(),
         }
      },
      {
         element: "banner",
         data: {
            text: "Slide 2",
            color_overlay: "rgba(0,0,0,0.3)",
            background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
         }
      }
   ];

   constructor(props) {
      super(props);
   }

   addSlide() {
      const id = elementManage.uuid();
      const sliderCount = this.sliderCount();

      const newSlide = {
         element: "banner",
         data: {
            key: `slider_${id}`,
            label: `Slide ${(sliderCount + 1)}`,
            background_image: "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
            color_overlay: "rgba(0,0,0,0.3)"
         },
      };

      this.setElements([newSlide], () => {
         this.showSlide(this.sliderCount() - 1);
      });
   }

   /*render() {
      const elementsDict = this.elementsDict || [];
      const {currentIndex, prevIndex} = this.state;
      const animation = this.getTransition();

      const sliders = [
         elementsDict[prevIndex],
         elementsDict[currentIndex],
      ]

      return super.render([
         ...sliders.map((element, index) => {

            const key = element.data.key; 
            const data = {
               ...element.data,
               animation: index == 0 ? null : animation,
               delay: 300,
               ...{
                  key: key
               },
               static_content: this.data.static_content,
               background_color: this.data.color_overlay,
            }

            return [
               this.getElement(element, {
                  className: index == 0 ? "position-absolute hide-time" : "show-time",
                  meta: {
                     data,
                     elements: element.elements,
                     key: key
                  },
                  ref: tab => {
                     if (tab) {
                        if (this.props.designer) {
                           tab.parentComponent = this;
                        }
                        this["slider" + index] = tab;
                     }
                  }
               }),
            ]
         })
      ]);
   }*/
}