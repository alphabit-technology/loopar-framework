import React, { createContext, useContext, useEffect, useState, useCallback, use } from "react"
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
  getDocuments: () => null,
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
  //const __DOCUMENT__ = __META__.__DOCUMENT__ || {}
  const __WORKSPACE_NAME__ = __META__.__WORKSPACE__?.name || "desk"

  const [Documents, setDocuments] = useState(props.Documents || {});
  const [loaded, setLoaded] = useState(false);
  const [activePage, setActivePage] = useState(props.activePage || "");
  const [activeModule, setActiveModule] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);

  const getDocuments = () => {
    return (
      <>
        {Object.values({ ...Documents }).map((Document) => {
          const { Module, __DOCUMENT__, active } = Document;
          return active && Module && <Module meta={__DOCUMENT__} key={__DOCUMENT__.key} />;
        })}
      </>
    );
  }

  const [openNav, setOpenNav] = useCookies(__WORKSPACE_NAME__);
  const [__DOCUMENTS__, set__DOCUMENTS__] = useState(getDocuments());

  useEffect(() => {
    set__DOCUMENTS__(getDocuments());
  }, [Documents, refreshFlag]);

  const handleSetOpenNav = useCallback(openNav => {
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

  const setDocument = (__META__) => {
    const copyDocuments = { ...Documents };

    Object.values(copyDocuments).forEach((Document) => {
      Document.active = false;
    });

    const setDocument1 = (Module) => {
      copyDocuments[__META__.key] = {
        Module: Module.default,
        __DOCUMENT__: __META__,
        active: true,
      };

      handleSetDocuments(copyDocuments);
    }

    AppSourceLoader(__META__.client_importer).then((Module) => {
      setDocument1(Module);
    }).catch(e => {
      __META__.client_importer.client = "app/error-view";

      AppSourceLoader(__META__.client_importer).then((Module) => {
        __META__.__DOCUMENT__ = {
          code: 404,
          title: "Source not found",
          description: e.message
        };

        setDocument1(Module);
      });
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

  useEffect(() => {
    loaded ? fetchDocument(pathname) : setLoaded(true);
    __WORKSPACE_NAME__ == "web" && setOpenNav(false);
  }, [pathname]);

  const getActiveDocument = () => {
    return Object.values(Documents).find((Document) => Document.active)?.__DOCUMENT__;
  }

  const getActiveParentMenu = () => {
    const __DOCUMENT__ = getActiveDocument();
    return __DOCUMENT__?.activeParentMenu || __DOCUMENT__?.__ENTITY__?.name;
  }

  useEffect(() => {
    const __DOCUMENT__ = getActiveDocument();
    if (!__DOCUMENT__) return;

    const activeParentMenu = __DOCUMENT__.activeParentMenu || __DOCUMENT__.__ENTITY__?.name;
    const module = (activeParentMenu !== "Module" ? __DOCUMENT__.__DOCUMENT__?.module || __DOCUMENT__.__MODULE__  || __DOCUMENT__.__ENTITY__?.module : null) || null;

    if (activeParentMenu) {
      const activeDocumentName = __DOCUMENT__?.__ENTITY__?.name;
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
    getDocuments: getDocuments,
    activePage: activePage,
    setDocument: setDocument,
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