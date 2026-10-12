import { cn } from "@cn/lib/utils";
import { PrintValue, PrintTable } from "@loopar/print/structure";
import { printKind } from "@loopar/print/format-value";

/**
 * Kinds a read-only view shows as their value (the rest keep their control):
 * `bool` keeps its checkbox/switch (made inert by BaseInput), `skip` (secrets,
 * style fields, rich JSON editors) keeps whatever it renders today.
 */
export const readsAsValue = (element, data) => !["bool", "skip"].includes(printKind(element, data));

/**
 * A field in a read-only view (the `view` entry, `readOnly` view option):
 * its label and its value in an inert box the size of the input — the form
 * keeps its layout, nothing is editable. Values are formatted like on paper
 * (@loopar/print): link titles, options, dates, money, child tables…
 */
export function ReadField({ element, data = {}, value, el, withoutLabel = false }) {
  const kind = printKind(element, data);
  const label = data.label || data.name;

  return (
    <div className="lp-read-field flex flex-col gap-2" data-read-field={data.name}>
      {!withoutLabel && label && <div className="text-sm font-medium leading-none text-muted-foreground">{label}</div>}
      <div
        className={cn(
          "lp-read-value min-h-10 w-full rounded-md px-3 py-2 text-sm text-foreground",
          kind === "table" ? "px-0 py-0" : "bg-muted/60",
          kind === "multiline" && "whitespace-pre-wrap",
        )}
      >
        {kind === "table"
          ? <PrintTable el={el} value={value} /> 
          : <PrintValue element={element} data={data} value={value} />}
      </div>
    </div>
  );
}
