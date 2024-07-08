import Component from "$component";
import { Droppable } from "$droppable";

export default class Col extends Component {
  dontHaveMetaElements = ["label", "text"];

  render(content = null) {
    return (
      <Droppable
        {...this.props}
        receiver={this}
      />
    )
  }

  get metaFields() {
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
}