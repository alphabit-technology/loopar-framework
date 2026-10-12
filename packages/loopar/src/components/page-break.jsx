import { usePrintRecord } from "@loopar/print/record";

/** Print element: forces the next content onto a new page. */
export default function PageBreak() {
  const record = usePrintRecord();
  if (!record) return <div className="lp-page-break-design">Page break</div>;
  return <div className="lp-page-break" />;
}

PageBreak.dontHaveMetaElements = ["name", "text", "label"];
