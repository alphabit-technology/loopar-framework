import { cn } from "@cn/lib/utils";
import { Droppable } from "@droppable";

/**
 * Print element: a titled section (title + rule), the paper counterpart of a
 * form's card / tab — same look as the automatic format's sections. Holds any
 * elements (rows, doc_fields, tables…).
 */
export default function DocSection(props) {
  const data = props.data || {};

  return (
    <section className={cn("lp-section", props.className)}>
      {data.label && <h3 className="lp-section-title">{data.label}</h3>}
      <Droppable {...props} className="lp-stack" />
    </section>
  );
}

DocSection.dontHaveMetaElements = ["name", "text"];
