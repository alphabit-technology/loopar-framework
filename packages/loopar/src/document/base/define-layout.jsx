import { useDocument } from "./provider";
import { ViewOptionsScope } from "./view-options";
import { pickViewOptions } from "../controller/view-options";

/**
 * Makes a layout component out of a body: `<ListLayout columns gridTemplate>{extra}</ListLayout>`.
 * The body gets `ctrl` and `children`; every other prop is a view option scoped to this subtree.
 * `defaults` are the layout's own baseline, below everything else (entry, config, hooks, props).
 */
export function defineLayout(name, Body, defaults) {
  function Layout({ children, ...props }) {
    const { ctrl } = useDocument();
    if (!ctrl) return children ?? null;   // standalone view

    const options = pickViewOptions(props);
    const body = <Body ctrl={ctrl}>{children}</Body>;
    return defaults || Object.keys(options).length
      ? <ViewOptionsScope defaults={defaults} options={options}>{body}</ViewOptionsScope>
      : body;
  }
  Layout.displayName = name;
  return Layout;
}
