import MetaComponent from "@meta-component";
import { defineLayout } from "../base/define-layout";

/** Page document (web or desk): structure + history. */
export const PageLayout = defineLayout("PageLayout", ({ ctrl, children }) => (
  <>
    <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
    {children}
    {ctrl.getDocumentHistory?.(true)}
  </>
));
