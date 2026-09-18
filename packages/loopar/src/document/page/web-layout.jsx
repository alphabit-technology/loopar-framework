import MetaComponent from "@meta-component";
import { defineLayout } from "../base/define-layout";

/** Web document: structure only, no chrome, no history. */
export const WebLayout = defineLayout("WebLayout", ({ ctrl, children }) => (
  <>
    <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
    {children}
  </>
));
