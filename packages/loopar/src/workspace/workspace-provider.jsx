import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react"
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
  
  const lastFetchedPath = useRef(pathname);
  const isInitialMount = useRef(true);

  const memoizedDocuments = useMemo(() => {
    return Object.values(Documents)
      .filter(document => document.active)
      .map(document => {
        const { Module, __DOCUMENT__ } = document;
        return Module && (
          <div 
            key={__DOCUMENT__.key}
            style={{
              transition: 'opacity 150ms ease-in-out',
              opacity: 1,
              width: '100%',
              height: '100%'
            }}
          >
            <Module meta={__DOCUMENT__} />
          </div>
        );
      });
  }, [Documents]);

  const [openNav, setOpenNav] = useCookies(__WORKSPACE_NAME__);
  const __DOCUMENTS__ = useMemo(() => memoizedDocuments, [memoizedDocuments, refreshFlag]);

  const handleSetOpenNav = useCallback((newOpenNav) => {
    setOpenNav(newOpenNav);
  }, [setOpenNav]);

  const handleToogleSidebarNav = useCallback(() => {
    setOpenNav(prev => !prev);
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

  const goToErrorView = useCallback((e) => {
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
  }, [__META__]);

  const loadDocument = useCallback((__META__, Module) => {
    try {
      const __DOCUMENT__ = __META__.__DOCUMENT__;

      setDocuments(prevDocuments => ({
        ...prevDocuments,
        [__DOCUMENT__.key]: {
          key: __DOCUMENT__.key,
          Module: Module.default,
          __DOCUMENT__: __DOCUMENT__,
          active: true,
        }
      }));
    } catch (err) {
      goToErrorView(err);
    }
  }, [goToErrorView]);

  const setDocument = useCallback((r) => {
    const __META__ = {
      key: r.key,
      __DOCUMENT__: r,
      client_importer: r.client_importer,
      __WORKSPACE__: r.__WORKSPACE__,
    }

    AppSourceLoader(__META__.client_importer)
      .then((Module) => {
        setDocuments(prevDocuments => {
          const updatedDocuments = { ...prevDocuments };
          
          Object.values(updatedDocuments).forEach((Document) => {
            Document.active = false;
          });

          return updatedDocuments;
        });
        
        loadDocument(__META__, Module);
      })
      .catch(e => goToErrorView(e));
  }, [loadDocument, goToErrorView]);

  const fetchDocument = useCallback((url) => {
    const route = window.location;
    if (route.hash.includes("#")) return Promise.resolve();

    return new Promise((resolve, reject) => {
      loopar.send({
        action: route.pathname,
        params: route.search,
        success: r => {
          setDocument(r);
          resolve();
        },
        error: e => {
          console.error("Error on fetch document", e);
          reject(e);
        }
      });
    });
  }, [setDocument]);

  const refresh = useCallback(() => {
    fetchDocument(pathname).then(() => {
      setRefreshFlag(prev => !prev);
    });
  }, [pathname, fetchDocument]);

  const getActiveDocument = useCallback(() => {
    return Object.values(Documents).find((Document) => Document.active) || {};
  }, [Documents]);

  const getActiveParentMenu = useCallback(() => {
    const {__DOCUMENT__} = getActiveDocument();
    return __DOCUMENT__?.activeParentMenu || __DOCUMENT__?.__ENTITY__?.name;
  }, [getActiveDocument]);

  const getTheme = useCallback(() => {
    const theme = loopar.cookie.get(storageKey);

    if (theme === "system") {
      if (typeof window !== "undefined") {
        return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      }
      return "dark"
    }

    return theme || "dark"
  }, [storageKey]);

  useEffect(() => {
    setTimeout(() => {
      setLoaded(true);
    }, 100);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (lastFetchedPath.current === pathname) return;
    
    lastFetchedPath.current = pathname;
    fetchDocument(pathname);

    if (__WORKSPACE_NAME__ === "web") {
      setOpenNav(false);
    }
  }, [pathname, loaded, fetchDocument, __WORKSPACE_NAME__, setOpenNav]);

  useEffect(() => {
    const {__DOCUMENT__} = getActiveDocument();
    if (!__DOCUMENT__) return;
    
    const {__ENTITY__, __MODULE__} = __DOCUMENT__;
    const activeParentMenu = __DOCUMENT__.activeParentMenu || __ENTITY__?.name;
    const module = (activeParentMenu !== "Module" ? __DOCUMENT__?.module || __MODULE__ || __ENTITY__?.module : null) || null;

    if (activeParentMenu) {
      const activeDocumentName = __ENTITY__?.name;
      if (activeDocumentName && activeDocumentName !== activePage) {
        setActivePage(activeDocumentName);
      }
    }

    setActiveModule(module);
  }, [Documents, getActiveDocument, activePage]);

  useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      window.history.pushState(null, null, window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const value = useMemo(() => ({
    theme: getTheme(),
    __META__,
    setTheme,
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    activeParentMenu: getActiveParentMenu(),
    ENVIRONMENT: props.ENVIRONMENT,
    Documents: Documents,
    activePage: activePage,
    activeModule,
    refresh,
    __DOCUMENTS__
  }), [
    getTheme,
    __META__,
    setTheme,
    openNav,
    handleSetOpenNav,
    handleToogleSidebarNav,
    props.menuItems,
    props.ENVIRONMENT,
    getActiveParentMenu,
    Documents,
    activePage,
    activeModule,
    refresh,
    __DOCUMENTS__
  ]);

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