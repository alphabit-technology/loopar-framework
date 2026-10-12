import { cn } from "@cn/lib/utils";
import { usePrintRecord } from "@loopar/print/record";
import { LetterheadBlock, LetterheadFooter } from "@loopar/print/letterhead";

/**
 * Print element: the letterhead of the print (the format's, else the default
 * one) — company block, or its footer line with `part: footer`.
 */
export default function Letterhead(props) {
  const data = props.data || {};
  const record = usePrintRecord();
  const footer = data.part === "footer";

  if (!record) {
    return (
      <div className={cn("lp-placeholder", props.className)}>
        {footer ? "Letterhead footer" : "Letterhead: logo, company, contact"}
      </div>
    );
  }

  return (
    <div className={props.className}>
      {footer ? <LetterheadFooter /> : <LetterheadBlock />}
    </div>
  );
}

Letterhead.dontHaveMetaElements = ["name", "text", "label"];

Letterhead.metaFields = () => [
  { group: "content", elements: { part: { element: SELECT, data: { label: "Part", options: "header:Header\nfooter:Footer" } } } },
];
