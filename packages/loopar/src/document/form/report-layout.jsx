import DeskUI from "../chrome/desk-ui";
import MetaComponent from "@meta-component";
import { defineLayout } from "../base/define-layout";

/** Desk report: chrome + structure, no save. */
export const ReportLayout = defineLayout("ReportLayout", ({ ctrl, children }) => (
  <DeskUI docRef={ctrl}>
    <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
    {children}
  </DeskUI>
));
