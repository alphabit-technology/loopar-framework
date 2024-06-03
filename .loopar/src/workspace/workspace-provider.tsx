import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router-dom';
import {useCookies} from "@services/cookie";

const usePathname = () => {
  return useLocation().pathname;
};

type Theme = "dark" | "light" | "system"

type WorkspaceProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string,
  workspace?: string,
  openNav?: boolean,
  menuItems?: [],
  loaded?: boolean,
  currentPage?: string,
  currentLink?: string,
  ENVIRONMENT?: string,
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
  openNav: loopar.cookie.get("openNav"),
  setOpenNav: () => null,
  loaded: false,
  setLoaded: () => null,
}

export const WorkspaceProviderContext = createContext<WorkspaceProviderState>(initialState)

/*const useMediaQuery = (query) => {
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
};*/

export function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: WorkspaceProviderProps) {
  const pathname = usePathname();

  const [theme, setTheme] = useState<Theme>(
    () => (loopar.cookie.get(storageKey) as Theme) || defaultTheme
  );

  const [openNav, setOpenNav] = useCookies("openNav");
  const [loaded, setLoaded] = useState<boolean>(false);

  const handleSetOpenNav = useCallback(
    (openNav) => {
      setOpenNav(openNav);
    },
    [openNav]
  );

  const handleToogleSidebarNav = useCallback(
    () => {
      handleSetOpenNav(!openNav);
    },
    [setOpenNav]
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
  }, [theme, pathname])


  const value = {
    theme,
    setTheme: (theme: Theme) => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      loopar.cookie.set(storageKey, theme)
      setTheme(theme)
    },
    workspace: props.workspace,
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    loaded,
    currentPage: props.currentPage,
    currentLink: props.currentLink,
    ENVIRONMENT: props.ENVIRONMENT
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
