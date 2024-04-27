import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import loopar from "$loopar";
import { useLocation } from 'react-router-dom';

const usePathname = () => {
  return useLocation().pathname;
};

type Theme = "dark" | "light" | "system"

type WorkspaceProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string,
  sidebarWidth?: number,
  collapseSidebarWidth?: number,
  workspace?: string,
  screenSize?: string,
  openNav?: boolean,
  menuItems?: [],
  headerHeight?: number,
  device?: string,
  loaded?: boolean,
}

type WorkspaceProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void,
  openNav?: boolean,
  setOpenNav?: (open: boolean) => void,
  loaded?: boolean,
  setLoaded?: (loaded: boolean) => void,
}

const initialState: WorkspaceProviderState = {
  theme: "system",
  setTheme: () => null,
  openNav: loopar.utils.cookie.get("openNav") === "true",
  setOpenNav: () => null,
  loaded: false,
  setLoaded: () => null,
}

export const WorkspaceProviderContext = createContext<WorkspaceProviderState>(initialState)

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);
      const listener = (e) => setMatches(e.matches);

      mediaQueryList.addListener(listener);
      setMatches(mediaQueryList.matches);

      return () => mediaQueryList.removeListener(listener);
    } else {

    }
  }, [query]);

  return matches;
};

export function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: WorkspaceProviderProps) {
  const pathname = usePathname();
  /*const isMobile = useMediaQuery('(max-width: 768px)');
  const isMedium = useMediaQuery('(max-width: 1024px)');*/

  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = useMediaQuery('(min-width: 1025px)');

  const screenSize = isMobile ? "sm" : isTablet ? "md" : "lg";
  const device = isMobile ? "mobile" : isTablet ? "tablet" : "desktop";

  const [theme, setTheme] = useState<Theme>(
    () => (loopar.utils.cookie.get(storageKey) as Theme) || defaultTheme
  )

  const [openNav, setOpenNav] = useState<boolean>(
    loopar.utils.cookie.get("openNav") === "true"
  );

  const [loaded, setLoaded] = useState<boolean>(false);

  const handleSetOpenNav = useCallback(
    (openNav) => {
      loopar.utils.cookie.set("openNav", openNav);
      setOpenNav(openNav);
    },
    [setOpenNav]
  );

  const handleToogleSidebarNav = useCallback(
    () => {
      handleSetOpenNav(!loopar.utils.cookie.get("openNav"));
    },
    [setOpenNav]
  );

  const handledLoaded = useCallback(
    () => {
      const root = document.getElementById("loopar-root");
      root && (root.style.display = "block")
      setLoaded(true);
    },
    [loaded]
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)

    if (screenSize !== "lg" && openNav) handleSetOpenNav(false);
  }, [theme, pathname])


  const value = {
    theme,
    setTheme: (theme: Theme) => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
        
      loopar.utils.cookie.set(storageKey, systemTheme)
      setTheme(systemTheme)
    },
    sidebarWidth: props.sidebarWidth,
    collapseSidebarWidth: props.collapseSidebarWidth,
    workspace: props.workspace,
    screenSize: screenSize,
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    headerHeight: props.headerHeight,
    device: device,
    loaded,
    setLoaded: handledLoaded,
  }

  return (
    <WorkspaceProviderContext.Provider {...props} value={value}>
      {children}
    </WorkspaceProviderContext.Provider>
  )
}

export const useWorkspace = () => {
  const context = useContext(WorkspaceProviderContext)

  if (context === undefined)
    throw new Error("useWorkspace must be used within a WorkspaceProvider")

  return context
}
