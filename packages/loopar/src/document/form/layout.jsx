import DeskUI from "../chrome/desk-ui";
import { defineLayout } from "../base/define-layout";
import { StructureFields } from "./structure-fields";
import { useViewOptions } from "../base/view-options";

/** Desk form (create/update) and read-only view: chrome + structure fields + history. */
export const FormLayout = defineLayout("FormLayout", ({ ctrl, children }) => {
  const { hasHistory } = useViewOptions();

  return (
    <DeskUI docRef={ctrl}>
      <StructureFields ctrl={ctrl} />
      {hasHistory !== false && ctrl.getDocumentHistory?.()}
      {children}
    </DeskUI>
  );
});
