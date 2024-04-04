import Component from "$component";
import {Droppable} from "$droppable";
import {WorkspaceProviderContext} from "@workspace/workspace-provider";  
import DynamicComponent from "./base/dynamic-component";
import {cn} from "@/lib/utils";
import loopar from "$loopar";

export default class Row extends Component {
  blockComponent = true;
  dontHaveMetaElements = ["label", "text"];
  droppable = true;

  static contextType = WorkspaceProviderContext;  

  setLayout(layout) {
    const meta = this.props;

    this.props.designerRef.updateElement(
      meta.data.key,
      {
        layout: JSON.stringify(layout),
      },
      true
    );
  }

  getLayout() {
    /*const meta = this.props || {};
    meta.data ??= {};
    return meta.data.layout && loopar.utils.isJSON(meta.data.layout)
      ? JSON.parse(meta.data.layout)
      : [];*/
  }

  getColumnsSelector() {
    const sizes = [
      [100],
      [50, 50],
      [66, 33],
      [33, 67],
      [25, 25, 25, 25],
      [25, 75],
      [75, 25],
      [40, 60],
      [60, 40],
      [20, 20, 20, 20, 20, 20],
      [20, 40, 40],
      [40, 20, 40],
    ];
    const buttonsCount = sizes.length;
    const bottonSize = 100 / sizes.length;

    return (<div></div>)

    /*return sizes.map((layout, layoutIndex) => {
      return (
        <div
          className={`progress ${layoutIndex < buttonsCount - 1 ? "mr-1" : ""}`}
          style={{
            width: bottonSize + "%",
            borderRadius: 0,
            backgroundColor: "transparent",
          }}
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            this.setLayout(layout);
          }}
        >
          {layout.map((size, index) => {
            return (
              <div
                className="progress-bar"
                style={{
                  width: size + "%",
                  border: "unset",
                  backgroundColor: `rgba(255,${Math.abs(150 - index * 50)},0,${
                    (index + 1) / layout.length
                  })`,
                }}
              ></div>
            );
          })}
        </div>
      );
    });*/
  }

  render() {
    const data = this.props?.data || {};
    const { screenSize = "lg" } = this.context; 

    const columsCount = this.props.elements?.length;
    const spacing = data.spacing || 1;

    const colsDistribution = {"xm": 1,"sm": 1, "md": 2, "lg": 3, "xl": 4}

    const colsAvailable = colsDistribution[screenSize];
    const colSize = 100 / (columsCount > colsAvailable ? colsAvailable : columsCount);
    const className = cn(`grid-${screenSize}-cols-${columsCount}-${spacing} align-items-stretch`, this.props.className || "")
    
    const cols = (this.props.elements || []);
    
    return (
      <>
      <style key={screenSize + columsCount}>
          {`
            .grid-${screenSize}-cols-${columsCount}-${spacing} {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(calc(${colSize}% - ${spacing}rem), 1fr));
              gap: ${spacing}rem;
            }
          `}
        </style>
      <Droppable 
        {...loopar.utils.renderizableProps(this.props)}
        className={className}
        receiver={this}
      >
        {this.props.children}
        {
          cols.map((el) => {
            return (
              <DynamicComponent elements={[el]} parent={this} />
            );
          })
        }
      </Droppable>
      </>
    );
  }

  get metaFields() {
    return {
      group: "custom",
      elements: {
        layout: {
          element: INPUT,
          data: {
            disabled: true,
          },
        },
        horizontal_alignment: {
          element: SELECT,
          data: {
            options: [
              { option: "left", value: "left" },
              { option: "center", value: "center" },
              { option: "right", value: "right" },
            ],
          },
        },
        vertical_alignment: {
          element: SELECT,
          data: {
            options: [
              { option: "top", value: "top" },
              { option: "center", value: "center" },
              { option: "bottom", value: "bottom" },
            ],
          },
        },
        row_height: {
          element: SELECT,
          data: {
            options: [
              { option: "auto", value: "auto" },
              { option: "100", value: "100%" },
              { option: "75", value: "75%" },
              { option: "50", value: "50%" },
              { option: "25", value: "25%" },
            ],
            description:
              "Define the height of the row based on the screen height.",
          },
        },
        full_height: {
          element: SWITCH,
          data: {
            description:
              "If enabled the slider will have the height of the screen.",
          },
        },
        spacing: {
          element: INPUT,
          data: {
            type: "number",
            description: "Spacing between columns in rem.",
          },
        },
      },
    };
  }
}
