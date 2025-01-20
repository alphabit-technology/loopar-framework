import {Droppable} from "@droppable";
import { LayoutSelector, gridLayouts} from "./row/LayoutSelector";
import ComponentDefaults from "./base/component-defaults";
import { loopar } from "loopar";
import { useEffect, useState } from "react";
import Emitter from '@services/emitter/emitter';
import { cn } from "@/lib/utils";

export default function Row(props) {
  const { data, setElements, set } = ComponentDefaults(props);
  const [layout, setLayout] = useState(loopar.utils.JSONparse(data.layout, [50, 50]));
  const [cols, setCols] = useState(props.elements || []);

  const conciliateCols = () => {
    const addCols = [
      ...cols
    ]
    if (cols.length < layout.length) {
      const diff = layout.length - cols.length;

      for (let i = 0; i < diff; i++){
        addCols.push({
          element: "col",
          data: {key: data.key + i}
        })
      }

      setElements(addCols, setCols(addCols));
    }
  }

  useEffect(() => {
    const newLayout = loopar.utils.JSONparse(data.layout);
    if (newLayout && data.layout != JSON.stringify(layout)){
      setLayout(newLayout);
    }
  }, [data.layout]);

  useEffect(() => {
    conciliateCols();
    Emitter.emit("currentElementEdit", data.key)
  }, [layout])
  
  const handleSetLayout = (layout) => {
    set("layout", JSON.stringify(layout));
  }

  useEffect(() => {
    setCols(props.elements || [])
  }, [props.elements]);

  const spacing = data.spacing || 1;
  const gap = spacing / 2;

  return (
    <div className="flex flex-col">
      <Droppable
        {...props}
        elements={cols}
        className={cn(
          `grid xm:grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 w-full`,
          'grid-container dynamic scrollbar-hide box-border'
        )}
        style={{
          "--column-layout": `calc(${layout.join("% - var(--grid-gap)) calc(")}% - var(--grid-gap))`,
          "--grid-gap": `${gap}rem`,
          gap: `${spacing}rem`
        }}
      />
      <LayoutSelector setLayout={handleSetLayout} current={layout}/>
    </div>
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
  }];
}
