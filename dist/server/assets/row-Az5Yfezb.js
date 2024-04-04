var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { C as Component, D as Droppable } from "./component-hNq1V6er.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import "../entry-server.js";
import { W as WorkspaceProviderContext } from "./workspace-provider-ZZuPyRcj.js";
import { a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import "./file-manager-elzUYIBp.js";
import "react";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
class Row extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "blockComponent", true);
    //className = "row grid grid-flow-col gap-4";
    __publicField(this, "dontHaveMetaElements", ["label", "text"]);
    __publicField(this, "droppable", true);
    __publicField(this, "dontHaveContainer", true);
  }
  setLayout(layout) {
    const meta = this.props;
    this.props.designerRef.updateElement(
      meta.data.key,
      {
        layout: JSON.stringify(layout)
      },
      true
    );
  }
  getLayout() {
  }
  getColumnsSelector() {
    return /* @__PURE__ */ jsx("div", {});
  }
  render(content) {
    var _a, _b;
    const data = ((_a = this.props) == null ? void 0 : _a.data) || {};
    content = content || this.props.children;
    const { horizontal_alignment, vertical_alignment, row_height } = data;
    const { screenSize } = this.context;
    if (row_height && row_height !== "auto") {
      this.style = {
        ...this.style,
        minHeight: row_height + "vh"
      };
    }
    const columsCount = (_b = this.props.elements) == null ? void 0 : _b.length;
    const spacing = data.spacing || 1;
    const colsDistribution = {
      "xm": 1,
      "sm": 1,
      "md": 2,
      "lg": 3,
      "xl": 4
    };
    const colsAvailable = colsDistribution[screenSize];
    const colSize = 100 / (columsCount > colsAvailable ? colsAvailable : columsCount);
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("style", { children: `
            .grid-${screenSize}-cols-${columsCount}-${spacing} {
              display: grid;
              grid-template-columns: repeat(auto-fill, minmax(calc(${colSize}% - ${spacing}rem), 1fr));
              gap: ${spacing}rem;
            }
          ` }, screenSize + columsCount),
      /* @__PURE__ */ jsxs(
        Droppable,
        {
          className: `grid-${screenSize}-cols-${columsCount}-${spacing} align-items-stretch`,
          receiver: this,
          children: [
            content,
            this.elements
          ]
        }
      )
    ] });
  }
  get Item() {
    return styled(Paper)(({ theme }) => ({
      backgroundColor: (theme2) => theme2.palette.primary.main,
      ...theme.typography.body2,
      padding: theme.spacing(1),
      textAlign: "center",
      color: theme.palette.text.secondary
    }));
  }
  get elements() {
    const columns = this.props.elements || [];
    const layout = [[1, 1], [1, 1]];
    if (this.props.designer && columns.length < layout.length) {
      const pending = layout.length - columns.length;
      const newColumns = [];
      for (let i = 0; i < pending; i++) {
        newColumns.push({
          element: COL,
          data: {
            key: elementManage.getUniqueKey()
          }
        });
      }
      this.setElements(newColumns);
      return;
    }
    const cols = this.props.elements || [];
    cols.length;
    return cols.map((el) => {
      return /* @__PURE__ */ jsx(DynamicComponent, { elements: [el], parent: this });
    });
  }
  componentDidMount() {
    super.componentDidMount();
  }
  get metaFields() {
    return {
      group: "custom",
      elements: {
        layout: {
          element: INPUT,
          data: {
            disabled: true
          }
        },
        horizontal_alignment: {
          element: SELECT,
          data: {
            options: [
              { option: "left", value: "left" },
              { option: "center", value: "center" },
              { option: "right", value: "right" }
            ]
          }
        },
        vertical_alignment: {
          element: SELECT,
          data: {
            options: [
              { option: "top", value: "top" },
              { option: "center", value: "center" },
              { option: "bottom", value: "bottom" }
            ]
          }
        },
        row_height: {
          element: SELECT,
          data: {
            options: [
              { option: "auto", value: "auto" },
              { option: "100", value: "100%" },
              { option: "75", value: "75%" },
              { option: "50", value: "50%" },
              { option: "25", value: "25%" }
            ],
            description: "Define the height of the row based on the screen height."
          }
        },
        full_height: {
          element: SWITCH,
          data: {
            description: "If enabled the slider will have the height of the screen."
          }
        },
        spacing: {
          element: INPUT,
          data: {
            type: "number",
            description: "Spacing between columns in rem."
          }
        }
      }
    };
  }
}
__publicField(Row, "contextType", WorkspaceProviderContext);
export {
  Row as default
};
