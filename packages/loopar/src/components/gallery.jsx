import BaseCarrusel from "@base-carrusel";
import Preassembled from "@preassembled";

export default function MetaGalery(props) {
  const defaultElements = [
    {
      element: "image",

      data: {
        background_image:
          "https://fastly.picsum.photos/id/174/800/600.jpg?hmac=cfaSWlI7126OpICaFPhVjWRVaaGrLtpZ7Ly9SksvbTM"
      },
    },
    {
      element: "image",
      data: {
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg"
      },
    },
  ];

  const mewItem = () => {
    const count = (props.elements || []).filter((element) => element.element === "banner").length;

    return {
      element: "image",
      data: {
        label: `Slide ${count + 1}`,
        background_image:
          "https://img.freepik.com/free-photo/digital-painting-mountain-with-colorful-tree-foreground_1340-25699.jpg",
        color_overlay: "rgba(0,0,0,0.3)",
      },
    };
  }

  return (
    <Preassembled 
      {...props} 
      notDroppable={true} 
      defaultElements={defaultElements}
    >
      <BaseCarrusel
        {...props}
        newItem={mewItem}
      />
    </Preassembled>
  );
}
