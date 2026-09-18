import DeskGUI from "@context/base/desk-gui";
import MetaComponent from "@meta-component";
import { FormWrapper } from "@context/form-provider";
import { ListGrid } from "@@table/ListGrid";
import { GridView } from "@@table/GridView";
import { TableProvider } from "@@table/TableContext";
import { usePersist } from "@services/persist-state";

/**
 * Per-kind layouts. Each one receives the controller (`ctrl`) and renders
 * the framework chrome for that kind of entry point. They are shared by the
 * functional views (`FormView`, `ListView`, ...) and by the legacy class
 * contexts, so both render exactly the same tree.
 */

/** Renders the document structure one top-level element at a time (forms). */
export function StructureFields({ ctrl }) {
  const STRUCTURE = ctrl.__STRUCTURE__;

  return STRUCTURE.map((el, idx) => {
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

/** Desk form (create/update) and read-only view. */
export function FormLayout({ ctrl, children }) {
  return (
    <FormWrapper __DATA__={ctrl.Document.data} STRUCTURE={ctrl.__STRUCTURE__} docRef={ctrl}>
      <DeskGUI docRef={ctrl}>
        <StructureFields ctrl={ctrl} />
        {ctrl.getDocumentHistory?.()}
        {children}
      </DeskGUI>
    </FormWrapper>
  );
}

/** Desk list: List/Grid toggle persisted per entity. */
export function ListLayout({ ctrl, children, hasSearchForm = true, onlyGrid, onlyList }) {
  const Document = ctrl.Document;
  const [viewType, setViewType] = usePersist(
    Document.Entity.name + "_viewType",
    Document.Entity.default_list_view || "List"
  );

  const getViewType = () => (onlyGrid === true ? "Grid" : viewType);

  const viewTypeToggle = () => {
    setViewType(viewType === 'List' ? 'Grid' : 'List');
  };

  return (
    <DeskGUI docRef={ctrl} viewTypeToggle={viewTypeToggle} viewType={viewType}>
      {children}
      <TableProvider initialDocument={Document} docRef={ctrl} rows={Document.rows}>
        {getViewType() === 'List' || onlyList ? (
          <ListGrid hasSearchForm={hasSearchForm} docRef={ctrl} />
        ) : (
          [<GridView key="grid" hasSearchForm={hasSearchForm} docRef={ctrl} />]
        )}
      </TableProvider>
    </DeskGUI>
  );
}

/** Page (web or desk page document). */
export function PageLayout({ ctrl, children }) {
  return (
    <>
      <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
      {children}
      {ctrl.getDocumentHistory?.(true)}
    </>
  );
}

/** Web document (no chrome, no history). */
export function WebLayout({ ctrl, children }) {
  return (
    <>
      <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
      {children}
    </>
  );
}

/** Desk report. */
export function ReportLayout({ ctrl, children }) {
  return (
    <FormWrapper __DATA__={ctrl.Document.data} STRUCTURE={ctrl.__STRUCTURE__} docRef={ctrl}>
      <DeskGUI docRef={ctrl}>
        <>
          <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
          {children}
        </>
      </DeskGUI>
    </FormWrapper>
  );
}

/** Bare form without desk chrome (installer, auth). */
export function BareFormLayout({ ctrl, children, withStructure = true }) {
  return (
    <FormWrapper __DATA__={ctrl.Document.data} STRUCTURE={withStructure ? ctrl.__STRUCTURE__ : undefined} docRef={ctrl}>
      <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
      {children}
    </FormWrapper>
  );
}
