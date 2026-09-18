/**
 * Page kind — UI of page/web entries (no logic layer of their own):
 *
 *   import { PageLayout } from "@loopar/page";
 *
 *   layout.jsx       <PageLayout/>  structure + history (web or desk page)
 *   web-layout.jsx   <WebLayout/>   structure only, no chrome, no history
 */
export { PageLayout } from "./layout";
export { WebLayout } from "./web-layout";
