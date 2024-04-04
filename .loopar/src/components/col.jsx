import Component from "$component";
import { Droppable } from "$droppable";
import loopar from "$loopar";

export default class Col extends Component {
  dontHaveMetaElements = ["label", "text"];

  render(content = null) {
    return (
      <Droppable
        {...loopar.utils.renderizableProps(this.props)}
        receiver={this}
      >
        {this.props.children}
        {content}
        {this.elements}
      </Droppable>
    )
    /*return (
      <Grid xs={6}>
        <>
          {this.props.children}
          {content}
          {this.elements}
        </>
      </Grid>
    );*/
  }

  componentDidMount() {
    super.componentDidMount();
    this.props.designer && this.addClass("element draggable");
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