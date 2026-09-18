import MetaComponent from "@meta-component";

/** Renders the document structure one top-level element at a time (forms). */
export function StructureFields({ ctrl }) {
  return ctrl.__STRUCTURE__.map((el, idx) => {
    const e = el.element;
    if (!e || !el.data || el.data?.hidden) return null;

    return (
      <MetaComponent
        key={el.data?.name ?? idx}
        elements={[{ element: e, ...el }]}
      />
    );
  });
}
