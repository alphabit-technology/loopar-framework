import Component from "$component";
import {Droppable} from "$droppable";
import {WorkspaceProviderContext} from "@workspace/workspace-provider";

export default function Row(props) {
  /*blockComponent = true;
  dontHaveMetaElements = ["label", "text"];
  droppable = true;*/

  //static contextType = WorkspaceProviderContext;  

  const setLayout = (layout) => {
    /*const meta = this.props;

    this.props.designerRef.updateElement(
      meta.data.key,
      {
        layout: JSON.stringify(layout),
      },
      true
    );*/
  }

  const getLayout = () => {
    /*const meta = this.props || {};
    meta.data ??= {};
    return meta.data.layout && loopar.utils.isJSON(meta.data.layout)
      ? JSON.parse(meta.data.layout)
      : [];*/
  }

  const getColumnsSelector = () => {
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

  const spacing = () => {
    return {
      0: "gap-0",
      1: "gap-1",
      2: "gap-2",
      3: "gap-3",
      4: "gap-4",
      5: "gap-5",
    }[props?.data?.spacing || 3]
  }

  const colsDistribution = () => {
    let columsCount = props.elements?.length || 1;
    columsCount = columsCount > 6 ? 6 : columsCount;
    return {
      1: "md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-1",
      2: "md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2",
      3: "md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3",
      4: "md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-4",
      5: "md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5",
      6: "md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6"
    }[columsCount]
  }

  const cols = (props.elements || []);
  
  return (
    <Droppable 
      //{...loopar.utils.renderizableProps(this.props)}
      {...props}
      elements={cols}
      //receiver={this}
      className={`grid xm:grid-cols-1 sm:grid-cols-1 ${colsDistribution()} ${spacing()}`}
    />
  );
}
 
Row.droppable = true;
Row.metaFields = () => {
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
        element: SELECT,
        data: {
          options: [
            { option: "0", value: 0 },
            { option: "1", value: 1 },
            { option: "2", value: 2 },
            { option: "3", value: 3 },
            { option: "4", value: 4 },
            { option: "5", value: 5 },
          ],
          description: "Spacing between columns in rem.",
        },
      },
    },
  };
}
