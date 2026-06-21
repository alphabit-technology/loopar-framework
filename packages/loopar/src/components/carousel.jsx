import BaseCarousel from "./carousel/base-carousel.jsx";
import Preassembled from "@preassembled";
import { useDesigner } from "@context/@/designer-context";

export default function Carousel(props){
  const { updateElements } = useDesigner();
  
  const defaultElements = [
    {
      element: "banner",
      node: props.node + "1",
      data: {
        label: "Slider 1..",
        text: "Slide 1..",
        color_overlay: "rgba(0,0,0,0.3)",
        background_image:
          "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80"
      },
    },
    {
      element: "banner",
      node: props.node + "2",
      data: {
        label: "Slider 2..",
        text: "Slide 2..",
        color_overlay: "rgba(0,0,0,0.3)",
        background_image:
          "https://images.unsplash.com/photo-1551434678-e076c223a692?w=1920&q=80",
      },
    },
  ];

  const newItem = () => {
    const count = (props.elements || []).filter((element) => element.element === "banner").length;

    return {
      element: "banner",
      node: props.node + `${ count + 1}`,
      data: {
        label: `Slide ${count + 1}`,
        text: `Slide ${count + 1}`,
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
        color_overlay: "rgba(0,0,0,0.3)",
      },
    };
  }

  const addSlide = () => {
    updateElements(props, [
      ...props.elements,
      newItem()
    ]);
  }

  return (
    <Preassembled
      {...props}
      notDroppable={true} 
      defaultElements={defaultElements}
    >
      <BaseCarousel
        {...props}
        addSlide={addSlide}
      />
    </Preassembled>
  );
}

Carousel.metaFields = BaseCarousel.metaFields;