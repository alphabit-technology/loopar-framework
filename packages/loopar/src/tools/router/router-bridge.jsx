import { useEffect } from "react";
import { useNavigate } from "react-router";
import loopar from "loopar";

/**
 * Bridge between react-router and the singleton `loopar`.
 *
 * `loopar` is instantiated at module level (singleton) and therefore cannot
 * access the `useNavigate` hook directly. This component lives inside the
 * react-router tree, obtains the `navigate` via the hook and registers it in
 * the singleton so that any code outside the React tree (controllers, callbacks,
 * imperative code) can call `loopar.navigate(url)` and get a real SPA navigation.
 *
 * It is mounted only once, as close as possible to the root, inside
 * <BrowserRouter> (or <StaticRouter> in SSR; in SSR the useEffect does not run,
 * so the bind never occurs — desired behavior).
 */
export function RouterBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    loopar._bindRouter({ navigate });
    return () => loopar._unbindRouter();
  }, [navigate]);

  return null;
}

export default RouterBridge;
