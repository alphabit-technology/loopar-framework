import { Droppable } from "@droppable";
import { LayoutSelector, gridLayouts } from "./row/LayoutSelector";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { loopar } from "loopar";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { cn } from "@cn/lib/utils";
import { RowContextProvider } from "./row/RowContext";
import { useWorkspace } from "@workspace/workspace-provider";
import { useDocument } from "@context/@/document-context";
import { isEqual } from "es-toolkit/predicate";
import elementManage from "@@tools/element-manage";

const DEFAULTS = {
  layout: [50, 50],
  spacing: 1,
  col_padding: "p-0",
  col_margin: "",
  horizontal_alignment: "left",
  vertical_alignment: "top",
  row_height: "auto",
  full_height: false,
};

const colPadding = ["p-0", "p-1", "p-2", "p-3", "p-4", "p-5", "p-6", "p-7", "p-8", "p-9"];

export default function Row(props) {
  const { setElements, set } = ComponentDefaults(props);
  const data = props.data;
  const [layout, setLayout] = useState(loopar.utils.JSONparse(data.layout, DEFAULTS.layout));
  const [cols, setCols] = useState(props.elements || []);
  const { webApp = {} } = useWorkspace();
  const { spacing = {} } = useDocument();
  const prevElementsRef = useRef(props.elements);

  const config = useMemo(() => ({
    ...DEFAULTS,
    ...data,
    spacing: data.spacing || spacing.spacing || webApp.spacing || DEFAULTS.spacing,
    col_padding: data.col_padding || spacing.col_padding || webApp.col_padding || DEFAULTS.col_padding,
    col_margin: data.col_margin || spacing.col_margin || webApp.col_margin || DEFAULTS.col_margin,
  }), [data, spacing, webApp]);

  

  const handleSetLayout = (layout) => {
    setLayout(layout);
    set("layout", JSON.stringify(layout));
  };

  const conciliateCols = useCallback(() => {
    if (cols.length < layout.length) {
      const diff = layout.length - cols.length;
      const addCols = [...cols];

      for (let i = 0; i < diff; i++) {
        addCols.push({
          element: "col",
          data: { key: elementManage.getUniqueKey() },
        });
      }

      setElements(addCols);
      setCols(addCols);
    }
  }, [layout, cols, setElements]);

  useEffect(() => {
    const newLayout = loopar.utils.JSONparse(data.layout);
    if (newLayout) {
      handleSetLayout(newLayout);
    }
  }, [data.layout]);

  useEffect(() => {
    conciliateCols();
  }, [layout]);

  useEffect(() => {
    if (loopar.utils.JSONparse(data.layout, []).length === 0) {
      handleSetLayout(DEFAULTS.layout);
    }
  }, []);

  useEffect(() => {
    if (cols && !isEqual(cols, props.elements)) {
      setCols(props.elements || []);
    }
  }, [props.elements]);

  const _spacing = useMemo(() => {
    const sp = parseInt(config.spacing);
    return Number.isNaN(sp) ? DEFAULTS.spacing : sp;
  }, [config.spacing]);

  const layoutAdjust = useMemo(() => {
    const total = layout.reduce((acc, val) => acc + val, 0);
    return layout.map(l => (l / total) * 100);
  }, [layout]);

  const gapSolver = useMemo(() => {
    return (_spacing * ((layout.length - 1) / layout.length)) || 0;
  }, [_spacing, layout.length]);
  const horizontalAlignment = useMemo(() => {
    return {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    }[config.horizontal_alignment] || "justify-start";
  }, [config.horizontal_alignment]);

  const verticalAlignment = useMemo(() => {
    return {
      top: "items-start",
      center: "items-center",
      bottom: "items-end",
    }[config.vertical_alignment] || "items-start";
  }, [config.vertical_alignment]);

  const rowHeight = useMemo(() => {
    if (config.full_height) return "min-h-screen";
    
    return {
      auto: "",
      100: "min-h-screen",
      75: "min-h-[75vh]",
      50: "min-h-[50vh]",
      25: "min-h-[25vh]",
    }[config.row_height] || "";
  }, [config.row_height, config.full_height]);

  return (
    <RowContextProvider
      colPadding={config.col_padding}
      colMargin={config.col_margin}
      spacing={_spacing}
    >
      <div className={cn("flex flex-col", rowHeight)}>
        <Droppable
          {...props}
          elements={cols}
          className={cn(
            "@container",
            "grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 w-full",
            "grid-container dynamic box-border",
            //horizontalAlignment,
            //verticalAlignment,
            rowHeight,
            data.class,
            
          )}
          style={{
            "--gap-solver": `${gapSolver}rem`,
            "--column-layout": `calc(${layoutAdjust.join("% - var(--gap-solver)) calc(")}% - var(--gap-solver))`,
            gap: `${_spacing}rem`,
            ...props.style,
          }}
        />
      </div>
      <LayoutSelector setLayout={handleSetLayout} current={layout} />
    </RowContextProvider>
  );
}

Row.droppable = true;

Row.metaFields = () => {
  return [
    {
      group: "layout",
      elements: {
        layout: {
          element: SELECT,
          data: {
            label: "Columns",
            options: gridLayouts.map(l => `[${l}]`),
            default_value: `[${DEFAULTS.layout}]`,
          },
        },
        spacing: {
          element: SELECT,
          data: {
            label: "Gap",
            options: [0, 1, 2, 3, 4, 5, 6],
            default_value: DEFAULTS.spacing,
            description: "Spacing between columns in rem.",
          },
        },
        col_padding: {
          element: SELECT,
          data: {
            label: "Column Padding",
            options: colPadding,
            default_value: DEFAULTS.col_padding,
          },
        },
      },
    },
    {
      group: "alignment",
      elements: {
        horizontal_alignment: {
          element: SELECT,
          data: {
            label: "Horizontal",
            options: ["left", "center", "right"],
            default_value: DEFAULTS.horizontal_alignment,
          },
        },
        vertical_alignment: {
          element: SELECT,
          data: {
            label: "Vertical",
            options: ["top", "center", "bottom"],
            default_value: DEFAULTS.vertical_alignment,
          },
        },
      },
    },
    {
      group: "size",
      elements: {
        row_height: {
          element: SELECT,
          data: {
            label: "Height",
            options: ["auto", "100", "75", "50", "25"],
            default_value: DEFAULTS.row_height,
            description: "Row height based on viewport.",
          },
        },
        full_height: {
          element: SWITCH,
          data: {
            label: "Full Screen",
            description: "Override height to 100vh.",
            default_value: DEFAULTS.full_height,
          },
        },
      },
    },
  ];
};