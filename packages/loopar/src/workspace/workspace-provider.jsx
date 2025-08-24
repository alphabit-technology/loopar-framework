import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router';
import { useCookies } from "@services/cookie";
import { AppSourceLoader } from "@loopar/loader";

const usePathname = () => {
  return useLocation();
};

const initialState = {
  theme: "system",
  setTheme: () => null,
  openNav: loopar.cookie.get("openNav"),
  setOpenNav: () => null,
  Documents: {},
  setDocuments: () => null,
  activePage: "",
  setActivePage: () => null,
  activeModule: "",
  setActiveModule: () => null
}

export const WorkspaceProviderContext = createContext(initialState)

export function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const pathname = usePathname();
  const [theme, setTheme] = useCookies(storageKey);
  const __META__ = props.__META__ || {}
  const __WORKSPACE_NAME__ = __META__.__WORKSPACE__?.name || "desk"

  const [Documents, setDocuments] = useState(props.Documents || {});
  const [loaded, setLoaded] = useState(false);
  const [activePage, setActivePage] = useState(props.activePage || "");
  const [activeModule, setActiveModule] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const memoizedDocuments = useMemo(() => {
    return Object.values(Documents)
      .filter(document => document.active)
      .map(document => {
        const { Module, __DOCUMENT__ } = document;
        return Module && <Module meta={__DOCUMENT__} key={__DOCUMENT__.key} />;
      });
  }, [Documents]);

  const [openNav, setOpenNav] = useCookies(__WORKSPACE_NAME__);
  const __DOCUMENTS__ = useMemo(() => memoizedDocuments, [Documents, refreshFlag]);

  const handleSetOpenNav = useCallback(openNav => {
    setOpenNav(openNav);
  }, [openNav]);

  const handleToogleSidebarNav = useCallback(() => {
    handleSetOpenNav(!openNav);
  }, [setOpenNav]);

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

  /**
   * Document: [{
   *    module: Component (imported),
   *    meta: Meta data of Document,
   *    key: Unique key of Document based on URL,
   * }]
   * #param res
  */

  const handleSetDocuments = (Documents) => {
    setDocuments(Documents);
  }

  const loadDocument = (__META__, Module) => {
    try {
      const copyDocuments = { ...Documents };
      const __DOCUMENT__ = __META__.__DOCUMENT__;

      copyDocuments[__DOCUMENT__.key] = {
        key: __DOCUMENT__.key,
        Module: Module.default,
        __DOCUMENT__: __DOCUMENT__,
        active: true,
      };

      handleSetDocuments(copyDocuments);
    } catch (err) {
      goToErrorView(err);
    }
  }

  const goToErrorView = (e) => {
    __META__.client_importer.client = "error-view";
    AppSourceLoader(__META__.client_importer).then((Module) => {
      __META__.__DOCUMENT__ = {
        key: "error404",
        code: 404,
        title: "Source not found",
        description: e.message
      };

      loadDocument(__META__, Module);
    });
  }

  const setDocument = (r) => {
    const __META__ = {
      key: r.key,
      __DOCUMENT__: r,
      client_importer: r.client_importer,
      __WORKSPACE__: r.__WORKSPACE__,
    }
    const copyDocuments = { ...Documents };

    Object.values(copyDocuments).forEach((Document) => {
      Document.active = false;
    });

    AppSourceLoader(__META__.client_importer).then((Module) => {
      return loadDocument(__META__, Module);
    }).catch(e => {
      return goToErrorView(e);
    });
  }

  const refresh = () => {
    fetchDocument(pathname).then(() => {
      setRefreshFlag(prev => !prev);
    });
  }

  const fetchDocument = (url) => {
    const route = window.location;
    if (route.hash.includes("#")) return;

    return new Promise((resolve, reject) => {
      loopar.send({
        action: route.pathname,
        params: route.search,
        success: r => {
          setDocument(r);
          resolve();
        },
        error: e => {
          console.error("Err on fecth document", e);
          reject();
        }
      });
    });
  }

  const getActiveDocument = useCallback(() => {
    return Object.values(Documents).find((Document) => Document.active) || {};
  }, [Documents]);

  useEffect(() => {
    loaded ? fetchDocument(pathname) : setLoaded(true);
    __WORKSPACE_NAME__ == "web" && setOpenNav(false);
  }, [pathname, activePage]);

  const getActiveParentMenu = useCallback(() => {
    const {__DOCUMENT__} = getActiveDocument();
    return __DOCUMENT__?.activeParentMenu || __DOCUMENT__?.__ENTITY__?.name;
  }, [Documents, pathname, refreshFlag]);

  useEffect(() => {
    const {__DOCUMENT__} = getActiveDocument();
    if (!__DOCUMENT__) return;
    
    const {__ENTITY__, __MODULE__} = __DOCUMENT__;

    const activeParentMenu = __DOCUMENT__.activeParentMenu || __ENTITY__?.name;
    const module = (activeParentMenu !== "Module" ? __DOCUMENT__?.module || __MODULE__  || __ENTITY__?.module : null) || null;

    if (activeParentMenu) {
      const activeDocumentName = __ENTITY__?.name;
      activeDocumentName && activeDocumentName != activePage && setActivePage(activeDocumentName);
    }

    setActiveModule(module)

  }, [Documents, pathname, refreshFlag]);

  const getTheme = () => {
    const theme = loopar.cookie.get(storageKey);

    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }

      return "dark"
    }

    return theme || "dark"
  }
  
  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, null, window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const value = {
    theme: getTheme(),
    __META__,
    setTheme,
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    //getActiveParentMenu: getActiveParentMenu,
    activeParentMenu: getActiveParentMenu(),
    ENVIRONMENT: props.ENVIRONMENT,
    Documents: Documents,
    activePage: activePage,
    activeModule,
    refresh,
    __DOCUMENTS__
  }

  return (
    <WorkspaceProviderContext.Provider value={value}>
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