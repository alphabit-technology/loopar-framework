import {Droppable} from "@droppable";
import { LayoutSelector, gridLayouts} from "./row/LayoutSelector";
import { ComponentDefaults } from "./base/ComponentDefaults";
import { loopar } from "loopar";
import { useEffect, useState, useRef, useCallback, useMemo, use } from "react";
import { cn } from "@cn/lib/utils";
import { RowContextProvider } from "./row/RowContext";
import { useWorkspace } from "@workspace/workspace-provider";
import { useDocument } from "@context/@/document-context";
import _ from "lodash";
import elementManage from "@@tools/element-manage"; 

const colPadding = ["p-0", "p-1", "p-2", "p-3", "p-4", "p-5", "p-6", "p-7", "p-8", "p-9"];

export default function Row(props) {
  const { data, setElements, set } = ComponentDefaults(props);
  const [ layout, setLayout ] = useState(loopar.utils.JSONparse(data.layout, [50,50]));
  const [ cols, setCols ] = useState(props.elements || []);
  const { webApp = {} } = useWorkspace();
  const { spacing = {} } = useDocument();
  const prevElementsRef = useRef(props.elements);

  const handleSetLayout = (layout) => {
    setLayout(layout);
    set("layout", JSON.stringify(layout));
  }

  const conciliateCols = useCallback(() => {
    const addCols = [...cols]
    if (cols.length < layout.length) {
      const diff = layout.length - cols.length;

      for (let i = 0; i < diff; i++) {
        addCols.push({
          element: "col",
          data: { key: elementManage.getUniqueKey() },
        })
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
      handleSetLayout([50, 50]);
    }
  }, []);

  useEffect(() => {
    if (prevElementsRef.current && !_.isEqual(prevElementsRef.current, props.elements)) {
      setCols(props.elements || []);
      prevElementsRef.current = props.elements;
    }
  }, [props.elements]);

  const _spacing = useMemo(() => {
    const sp =  parseInt(data.spacing || spacing.spacing || webApp.spacing || 1);
    return Number.isNaN(sp) ? 1 : sp;
  }, [data.spacing, spacing.spacing, webApp.spacing]);

  const layoutAdjust = useMemo(() => {
    return layout.map(l => (l / (layout.reduce((acc, val) => acc + val, 0) / 100)));
  }, [layout]);

  const gapSolver = useMemo(() => {
    return (_spacing * ((layout.length - 1) / layout.length)) || 0;
  }, [_spacing, layout.length]);

  return (
    <RowContextProvider
      colPadding={data.col_padding || spacing.col_padding || webApp.col_padding}
      colMargin={data.col_margin || spacing.col_margin || webApp.col_margin}
      spacing={_spacing}
    >
      <div className="flex flex-col">
        <Droppable
          {...props}
          elements={cols}
          className={cn(
            '@container',
            `grid xm:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 w-full`,
            'grid-container dynamic box-border',
          )}
          style={{
            "--gap-solver": `${gapSolver}rem`,
            "--column-layout": `calc(${layoutAdjust.join("% - var(--gap-solver)) calc(")}% - var(--gap-solver))`,
            gap: `${_spacing}rem`
          }}
        />
        
      </div>
      <LayoutSelector setLayout={handleSetLayout} current={layout}/>
    </RowContextProvider>
  );
}
 

Row.droppable = true;
Row.metaFields = () => {
  return [{
    group: "custom",
    elements: {
      layout: {
        element: SELECT,
        data: {
          options: gridLayouts.map(l => `[${l}]`)
        },
      },
      horizontal_alignment: {
        element: SELECT,
        data: {
          options: ["left","center","right"],
        },
      },
      vertical_alignment: {
        element: SELECT,
        data: {
          options: ["top", "center","bottom"],
        },
      },
      row_height: {
        element: SELECT,
        data: {
          options: ["auto",100,75,50,25],
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
          options: [1,2,3,4,5,6],
          description: "Spacing between columns in rem.",
        },
      },
      col_padding: {
        element: SELECT,
        data: {
          options: colPadding,
          description: "Spacing between columns in rem.",
        },
      },
    },
  }];
}
