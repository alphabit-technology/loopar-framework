import elementManage from "@@tools/element-manage";
import BaseCarrusel from "@base-carrusel";

export default function Slider(props) {
  const defaultElements = [
    {
      element: "banner",
      data: {
        text: "Slide 1",
        color_overlay: "rgba(0,0,0,0.3)",
        background_image:
          "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM",
        key: elementManage.uuid(),
      },
    },
    {
      element: "banner",
      data: {
        text: "Slide 2",
        color_overlay: "rgba(0,0,0,0.3)",
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
      },
    },
  ];

  const addSlide = () => {
    const id = elementManage.uuid();
    const sliderCount = this.sliderCount();

    const newSlide = {
      element: "banner",
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

  return (
    <BaseCarrusel
      {...props}
      defaultElements={defaultElements}
      addSlide={addSlide}
    />
  );
}
