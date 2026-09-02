import { useMemo, useState } from "react";
import { useDesigner } from "@context/@/designer-context";
import { cn } from "@cn/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@cn/components/ui/popover";
import { loopar } from "loopar";
import { DEFAULTS } from "../base/ComponentDefaults";

export const gridLayouts = [
  [100],
  [50, 50],
  [66, 33],
  [33, 66],
  [75, 25],
  [25, 75],
  [40, 60],
  [60, 40],
  [80, 20],
  [20, 80],
  [33, 33, 33],
  [50, 25, 25],
  [25, 50, 25],
  [25, 25, 50],
  [20, 40, 40],
  [40, 20, 40],
  [40, 40, 20],
  [50, 30, 20],
  [70, 15, 15],
  [25, 25, 25, 25],
  [40, 20, 20, 20],
  [20, 20, 20, 20, 20],
  [16, 16, 16, 16, 16, 16],
];

/**
 * Accepts the persisted string ("[50,50]"), an already-parsed array or
 * nothing, and always returns a usable layout (array of positive numbers).
 */
export function parseLayout(value) {
  const parsed = Array.isArray(value) ? value : loopar.utils.JSONparse(value, null);
  if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULTS.layout;
  const nums = parsed.map(Number).filter(n => Number.isFinite(n) && n > 0);
  return nums.length === parsed.length ? nums : DEFAULTS.layout;
}

export const sameLayout = (a, b) =>
  a?.length === b?.length && a.every((v, i) => v === b[i]);

export const layoutLabel = (layout) => layout.join(" / ");

/** Neutral miniature of a layout: one block per column, widths proportional. */
function LayoutThumb({ layout, className, active }) {
  const total = layout.reduce((acc, v) => acc + v, 0);
  return (
    <div className={cn("flex h-full w-full gap-px", className)}>
      {layout.map((size, i) => (
        <div
          key={i}
          className={cn("h-full rounded-[1px]", active ? "bg-primary" : "bg-muted-foreground/50")}
          style={{ width: `${(size / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

const stop = (e) => { e.stopPropagation(); };

export function LayoutSelector({ setLayout, current }) {
  const { designerMode, designing } = useDesigner();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(current.length);

  const groups = useMemo(() => {
    const byCount = new Map();
    for (const l of gridLayouts) {
      if (!byCount.has(l.length)) byCount.set(l.length, []);
      byCount.get(l.length).push(l);
    }
    return byCount;
  }, []);

  if (!designerMode || !designing) return null;

  const counts = [...groups.keys()];
  const activeCount = groups.has(count) ? count : current.length;
  const options = groups.get(activeCount) || [];

  const choose = (layout) => {
    setLayout(layout);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (o) setCount(current.length);
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          title={`Layout ${layoutLabel(current)}`}
          className={cn(
            "no-drag absolute bottom-1 left-1 z-11 flex items-center gap-1.5 rounded px-1.5 py-1",
            "bg-zinc-800/95 border border-zinc-600/60 shadow-md backdrop-blur-sm",
            "text-[10px] leading-none text-zinc-300 hover:text-primary hover:border-primary/60"
          )}
          onPointerDown={stop}
          onClick={stop}
        >
          <div className="h-3 w-8"><LayoutThumb layout={current} active /></div>
          <span className="font-mono">{layoutLabel(current)}</span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        side="top"
        className="no-drag w-64 p-2 space-y-2"
        onPointerDown={stop}
        onClick={stop}
      >
        <div className="flex gap-1">
          {counts.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setCount(n)}
              className={cn(
                "flex-1 rounded py-1 text-xs border transition-colors",
                n === activeCount
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {options.map((layout) => {
            const active = sameLayout(layout, current);
            return (
              <button
                key={layout.join("-")}
                type="button"
                onClick={() => choose(layout)}
                className={cn(
                  "flex flex-col gap-1 rounded border p-1.5 transition-colors",
                  active ? "border-primary bg-primary/10" : "border-border hover:bg-muted"
                )}
              >
                <div className="h-5 w-full"><LayoutThumb layout={layout} active={active} /></div>
                <span className={cn("font-mono text-[10px] leading-none", active ? "text-primary" : "text-muted-foreground")}>
                  {layoutLabel(layout)}
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
