import { cn } from "@cn/lib/utils";
import { usePrintRecord, usePrintDesign } from "@loopar/print/record";
import { PrintHeader } from "@loopar/print/structure";

/** Print element: document title block (title, record name, print date). */
export default function DocHeader(props) {
  const data = props.data || {};
  const record = usePrintRecord();
  const design = usePrintDesign();

  if (!record) {
    return (
      <header className={cn("lp-header", props.className)}>
        <div>
          <div className="lp-title">{data.label || design.entity || "Document"}</div>
          <div className="lp-subtitle lp-placeholder-muted">{"{name}"}</div>
        </div>
        <div className="lp-header-aside lp-placeholder-muted">{"{date}"}</div>
      </header>
    );
  }

  return (
    <div className={props.className}>
      <PrintHeader title={data.label || undefined} />
    </div>
  );
}

DocHeader.dontHaveMetaElements = ["name", "text"];

DocHeader.metaFields = () => [
  { group: "content", elements: { label: { element: INPUT, data: { label: "Title", placeholder: "Empty = entity name" } } } },
];
