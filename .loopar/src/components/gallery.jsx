import BaseCarrusel from "@base-carrusel";
import elementManage from "$tools/element-manage";

export default class Slider extends BaseCarrusel {
  defaultElements = [
    {
      element: "image",

      data: {
        color_overlay: "rgba(0,0,0,0.3)",
        background_image:
          "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM",
        key: elementManage.uuid(),
      },
    },
    {
      element: "image",
      data: {
        color_overlay: "rgba(0,0,0,0.3)",
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
        key: elementManage.uuid(),
      },
    },
  ];

  addSlide() {
    const id = elementManage.uuid();
    const sliderCount = this.sliderCount();

    const newSlide = {
      element: "image",
      data: {
        key: `slider_${id}`,
        label: `Slide ${sliderCount + 1}`,
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
        color_overlay: "rgba(0,0,0,0.3)",
      },
    };

    this.setElements([newSlide], () => {
      this.showSlide(this.sliderCount() - 1);
    });
  }
}
