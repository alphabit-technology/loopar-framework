import { useDocument } from "./provider";
import { ViewOptionsScope } from "./view-options";
import { pickViewOptions } from "../controller/view-options";

/**
 * Makes a layout component out of a body: `<ListLayout columns gridTemplate>{extra}</ListLayout>`.
 * The body gets `ctrl` and `children`; every other prop is a view option scoped to this subtree.
 */
export function defineLayout(name, Body) {
  function Layout({ children, ...props }) {
    const { ctrl } = useDocument();
    if (!ctrl) return children ?? null;   // standalone view

    const options = pickViewOptions(props);
    const body = <Body ctrl={ctrl}>{children}</Body>;
    return Object.keys(options).length ? <ViewOptionsScope options={options}>{body}</ViewOptionsScope> : body;
  }
  Layout.displayName = name;
  return Layout;
}
