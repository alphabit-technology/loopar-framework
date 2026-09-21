import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { mergeViewOptions, pickViewOptions } from "../controller/view-options";

/**
 * Presentation options of an entry as React state. Precedence, low → high:
 * layout defaults < entry defaults + view `config` (`base`) < hook patches (useActions...) < layout props.
 * `has*` flags are opt-out: consumers read `x !== false`.
 */
const ViewOptionsContext = createContext({ options: {}, patch: () => {} });

export function ViewOptionsProvider({ base, children }) {
  const [dynamic, setDynamic] = useState({});

  const patch = useCallback((updater) => {
    setDynamic((prev) => (typeof updater === "function" ? updater(prev) : mergeViewOptions(prev, updater)));
  }, []);

  const value = useMemo(() => ({ options: mergeViewOptions(base, dynamic), patch }), [base, dynamic, patch]);

  return <ViewOptionsContext.Provider value={value}>{children}</ViewOptionsContext.Provider>;
}

/** Adds options for a subtree: `defaults` go under the inherited ones, `options` (layout props) on top. */
export function ViewOptionsScope({ defaults, options: extra, children }) {
  const ctx = useContext(ViewOptionsContext);
  const value = useMemo(
    () => ({ ...ctx, options: mergeViewOptions(defaults, ctx.options, pickViewOptions(extra)) }),
    [ctx, defaults, extra]
  );

  return <ViewOptionsContext.Provider value={value}>{children}</ViewOptionsContext.Provider>;
}

export const useViewOptions = () => useContext(ViewOptionsContext).options;
export const useViewOptionsPatch = () => useContext(ViewOptionsContext).patch;
