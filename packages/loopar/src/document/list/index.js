/**
 * List kind — logic + UI of a list entry:
 *
 *   import { useList, ListLayout } from "@loopar/list";
 *
 *   provider.jsx   ListProvider (mounted by <Entry/> above the view), useList
 *   layout.jsx     <ListLayout/>  desk chrome + List/Grid
 */
export { ListProvider, useList } from "./provider";
export { ListLayout } from "./layout";
