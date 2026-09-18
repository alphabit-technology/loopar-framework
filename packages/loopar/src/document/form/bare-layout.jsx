import MetaComponent from "@meta-component";
import { defineLayout } from "../base/define-layout";

/** Bare structure without desk chrome (installer, auth forms). */
export const BareLayout = defineLayout("BareLayout", ({ ctrl, children }) => (
  <>
    <MetaComponent elements={ctrl.__STRUCTURE__} parent={ctrl} />
    {children}
  </>
));
