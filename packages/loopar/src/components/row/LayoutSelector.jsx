
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";

export const gridLayouts = [
  [100],               // One column, full width (100%)
  [50, 50],            // Two equal columns (50% each)
  [33, 33, 33],        // Three equal columns (33.33% each)
  [25, 25, 25, 25],    // Four equal columns (25% each)
  [20, 20, 20, 20, 20], // Five equal columns (20% each)
  [66, 33],            // Two columns (66% and 33%)
  [33, 66],            // Two columns (33% and 66%)
  [75, 25],            // Two columns (75% and 25%)
  [25, 75],            // Two columns (25% and 75%)
  [40, 60],            // Two columns (40% and 60%)
  [60, 40],            // Two columns (60% and 40%)
  [20, 40, 40],        // Three columns (20%, 40%, 40%)
  [40, 20, 40],        // Three columns (40%, 20%, 40%)
  [50, 25, 25],        // Three columns (50%, 25%, 25%)
  [25, 50, 25],        // Three columns (25%, 50%, 25%)
  [16, 16, 16, 16, 16, 16], // Six equal columns (16.66% each)
  [80, 20],            // Two columns (80% and 20%)
  [20, 80],            // Two columns (20% and 80%)
  [50, 30, 20],        // Three columns (50%, 30%, 20%)
  [70, 15, 15],        // Three columns (70%, 15%, 15%)
];

const buttonsCount = gridLayouts.length;
const buttonSize = 100 / gridLayouts.length;

export function LayoutSelector({ setLayout, current }) {
  const { designerMode, designing } = useDesigner();
  if (!designerMode || !designing) return;

  return (
    <div 
      className="flex flex-row h-5"
    >
      {gridLayouts.map((layout, layoutIndex) => {
        return (
          <button
            key={JSON.stringify(layout)}
            className={cn(
              "p-0 h-full flex flex-row",
              layoutIndex < buttonsCount - 1 ? "mr - 1" : "",
              JSON.stringify(layout) == JSON.stringify(current) && "border-border",
            )}
            style={{
              width: buttonSize + "%",
              margin: 1,
              border: JSON.stringify(layout) == JSON.stringify(current) ?"1px solid" : 0
            }}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              setLayout(layout)
            }}
          >
            {layout.map((size, index) => {
              return (
                <div
                  className="h-full"
                  style={{
                    width: size + "%",
                    backgroundColor: `rgba(255,${Math.abs(150 - index * 50)},0,${(index + 1) / layout.length})`,
                  }}
                ></div>
              );
            })}
          </button>
        )
      })}
    </div>
  )
}