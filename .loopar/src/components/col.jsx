import { Droppable } from "@droppable";

export default function Col (props) {
  return (
    <Droppable
      {...props}
    />
  );
}

Col.dontHaveMetaElements = ["label", "text"];
Col.droppable = true;
Col.metaFields = () => {
  const inputs = ["xm", "sm", "md", "lg", "xl"].map((size) => {
    return {
      element: INPUT,
      data: {
        name: size,
        label: `col-${size}`,
        format: "number",
        min: 1,
        max: 12,
      },
    };
  });

  return [
    {
      group: "general",
      elements: inputs.reduce((acc, input) => {
        acc[input.data.name] = input;
        return acc;
      }, {}),
    },
  ];
}