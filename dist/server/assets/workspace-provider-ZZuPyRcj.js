import { jsx } from "react/jsx-runtime";
import { createContext, useState, useCallback, useEffect, useContext } from "react";
import { l as loopar } from "../entry-server.js";
import { useLocation } from "react-router-dom";
const usePathname = () => {
  return useLocation().pathname;
};
const initialState = {
  theme: "system",
  setTheme: () => null,
  openNav: loopar.utils.cookie.get("openNav") === "true",
  setOpenNav: () => null
};
const WorkspaceProviderContext = createContext(initialState);
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const mediaQueryList = window.matchMedia(query);
      const listener = (e) => setMatches(e.matches);
      mediaQueryList.addListener(listener);
      setMatches(mediaQueryList.matches);
      return () => mediaQueryList.removeListener(listener);
    }
  }, [query]);
  return matches;
};
function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isTablet = useMediaQuery("(max-width: 1024px)");
  useMediaQuery("(min-width: 1025px)");
  const screenSize = isMobile ? "sm" : isTablet ? "md" : "lg";
  const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";
  const [theme, setTheme] = useState(
    () => loopar.utils.cookie.get(storageKey) || defaultTheme
  );
  const [openNav, setOpenNav] = useState(
    loopar.utils.cookie.get("openNav") === "true"
  );
  const handleSetOpenNav = useCallback(
    (openNav2) => {
      loopar.utils.cookie.set("openNav", openNav2);
      setOpenNav(openNav2);
    },
    [setOpenNav]
  );
  const handleToogleSidebarNav = useCallback(
    () => {
      handleSetOpenNav(!loopar.utils.cookie.get("openNav"));
    },
    [setOpenNav]
  );
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.add(systemTheme);
      return;
    }
    root.classList.add(theme);
    if (screenSize !== "lg" && openNav)
      handleSetOpenNav(false);
  }, [theme, pathname]);
  const value = {
    theme,
    setTheme: (theme2) => {
      loopar.utils.cookie.set(storageKey, theme2);
      setTheme(theme2);
    },
    sidebarWidth: props.sidebarWidth,
    collapseSidebarWidth: props.collapseSidebarWidth,
    workspace: props.workspace,
    screenSize,
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    headerHeight: props.headerHeight,
    device
  };
  return /* @__PURE__ */ jsx(WorkspaceProviderContext.Provider, { ...props, value, children });
}
const useWorkspace = () => {
  const context = useContext(WorkspaceProviderContext);
  if (context === void 0)
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  return context;
};
export {
  WorkspaceProviderContext as W,
  WorkspaceProvider as a,
  useWorkspace as u
};
