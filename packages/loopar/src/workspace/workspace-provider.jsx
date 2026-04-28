import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, useTransition } from "react"
import { loopar } from "loopar";
import { useLocation, useNavigate } from 'react-router';
import { useCookies } from "@services/cookie";
import { AppSourceLoader } from "@loopar/loader";
import {useAuth} from "@context/AuthContext"

const initialState = {
  theme: "system",
  setTheme: () => null,
  openNav: loopar.cookie.get("openNav"),
  setOpenNav: () => null,
  ActiveView: null,
  setDocuments: () => null,
  activePage: "",
  setActivePage: () => null,
  activeModule: "",
  setActiveModule: () => null,
  pathname: "",
  navigate: () => null,
  award: () => null
}

export const WorkspaceProviderContext = createContext(initialState)

export function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const [theme, setTheme] = useCookies(storageKey);
  const __META__ = props.__META__ || {}
  const __WORKSPACE_NAME__ = __META__.name || "desk"

  const [Documents, setDocuments] = useState(props.Documents || {});
  const [loaded, setLoaded] = useState(false);
  const [activePage, setActivePage] = useState(props.activePage || "");
  const [activeModule, setActiveModule] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [isPending, startTransition] = useTransition();
  const {award} = useAuth();

  const [pathname, setPathname] = useState(
    props.pathname || (typeof window !== "undefined" ? window.location.pathname + window.location.search : "")
  );

  const __META_CACHE__ = {};
  const routerNavigate = useNavigate();
  const lastFetchedPath = useRef(null);
  const fetchIdRef = useRef(0);
  const isInitialMount = useRef(true);

  const location = useLocation();
  useEffect(() => {
    const newPath = location.pathname + location.search;
    setPathname(newPath);
  }, [location.pathname, location.search]);

  const navigate = useCallback((url) => {
    routerNavigate(url);
  }, [routerNavigate]);

  const memoizedActiveView = useMemo(() => {
    return Object.values(Documents)
      .filter(doc => doc.active)
      .map(doc => {
        const { View } = doc;
        return View && <View Document={doc.Document} key={doc.key} />;
      });
  }, [Documents]);

  const [openNav, setOpenNav] = useCookies(__WORKSPACE_NAME__);
  const ActiveView = useMemo(() => memoizedActiveView, [memoizedActiveView, refreshFlag]);

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
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme, pathname])

  const goToErrorView = useCallback((e) => {
    __META__.Document = {
      key: "error404",
      entryPoint: "error-view",
    };
    AppSourceLoader(__META__.Document).then((Module) => {
      __META__.Document.data = {
        code: 404,
        title: "Source not found",
        description: e.message
      };
      loadDocument(__META__, Module);
    });
  }, [__META__]);

  const loadDocument = useCallback((__META__, Module) => {
    try {
      startTransition(() => {
        setDocuments(setDocuments => ({
          ...setDocuments,
          [__META__.key]: {
            View: Module.default,
            ...__META__,
            active: true,
          }
        }));
      });
    } catch (err) {
      goToErrorView(err);
    }
  }, [goToErrorView]);

  const setDocument = useCallback((r) => {
    let __META__ = {};

    if (__META_CACHE__[r.instance]) {
      __META__ = __META_CACHE__[r.instance];
      __META__.Document = { ...__META_CACHE__[r.instance].Document, ...r }
    } else {
      __META__ = {
        key: r.key,
        Document: r,
      }
      __META_CACHE__[r.instance] = __META__
    }

    AppSourceLoader(__META__.Document).then((Module) => {
      startTransition(() => {
        setDocuments(prevDocuments => {
          const updatedDocuments = { ...prevDocuments };
          Object.values(updatedDocuments).forEach((Document) => {
            Document.active = false;
          });
          return updatedDocuments;
        });
      });

      loadDocument(__META__, Module);
    }).catch(e => goToErrorView(e));
  }, [loadDocument, goToErrorView]);

  const fetchDocument = useCallback((url) => {
    const route = window.location;
    if (route.hash?.includes("#")) return Promise.resolve();

    const currentFetchId = ++fetchIdRef.current;
    const targetPath = route.pathname;
    const targetSearch = route.search || '';
    const preloadedMeta = !!__META_CACHE__[loopar.utils.urlInstance(route)];

    return new Promise((resolve, reject) => {
      loopar.send({
        action: targetPath,
        query: `${targetSearch.length ? targetSearch + "&" : "?"}preloaded=${preloadedMeta}`,
        success: r => {
          if (currentFetchId !== fetchIdRef.current) return;

          lastFetchedPath.current = { pathname: targetPath, search: targetSearch };
          setDocument(r);
          resolve();
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
    return (Object.values(Documents).find(Document => Document.active) || {}).Document
  }, [Documents]);

  const getActiveParentMenu = useCallback(() => {
    const Document = getActiveDocument();
    return Document?.activeParentMenu || Document?.Entity?.name;
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
    
    if (!lastFetchedPath.current) {
      lastFetchedPath.current = {
        pathname: window.location.pathname,
        search: window.location.search
      };
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (
      lastFetchedPath.current?.pathname === window.location.pathname &&
      lastFetchedPath.current?.search === window.location.search
    ) return;

    fetchDocument(pathname);

    if (__WORKSPACE_NAME__ === "web") {
      setOpenNav(false);
    }
  }, [pathname, loaded, fetchDocument, __WORKSPACE_NAME__]);

  useEffect(() => {
    const Document = getActiveDocument();
    if (!Document) return;

    const entity = Document.Entity || {};
    const activeParentMenu = Document.activeParentMenu || entity?.name;
    const moduleName = (activeParentMenu !== "Module" ? Document?.meta?.module || entity?.module : null) || null;

    if (activeParentMenu) {
      const activeDocumentName = entity?.name;
      if (activeDocumentName && activeDocumentName !== activePage) {
        setActivePage(activeDocumentName);
      }
    }

    setActiveModule(moduleName);
  }, [ActiveView, getActiveDocument, activePage]);

  const value = useMemo(() => ({
    theme: getTheme(),
    __META__,
    setTheme,
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    activeParentMenu: getActiveParentMenu(),
    ENVIRONMENT: __META__.environment || props.ENVIRONMENT,
    ActiveView,
    activePage,
    activeModule,
    refresh,
    isPending,
    workspace: __WORKSPACE_NAME__,
    pathname,
    navigate,
    award
  }), [
    getTheme,
    __META__,
    setTheme,
    openNav,
    handleSetOpenNav,
    handleToogleSidebarNav,
    props.menuItems,
    getActiveParentMenu,
    ActiveView,
    activePage,
    activeModule,
    refresh,
    isPending,
    pathname,
    navigate,
    award
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