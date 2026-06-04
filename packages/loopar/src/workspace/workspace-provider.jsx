import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, useTransition } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router';
import { useCookies } from "@services/cookie";
import { usePersist } from "@services/persist-state";
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
  award: () => null
}

export const WorkspaceProviderContext = createContext(initialState)

export function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  sourceStorageKey = "vite-ui-theme-source",
  ...props
}) {
  const [storedTheme, setStoredTheme] = useCookies(storageKey);
  const [storedSource, setStoredSource] = useCookies(sourceStorageKey);

  const setTheme = useCallback((value) => {
    setStoredTheme(value);
    setStoredSource("manual");
  }, [setStoredTheme, setStoredSource]);

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

  const metaCacheRef = useRef({});
  const lastFetchedPath = useRef(null);
  const fetchIdRef = useRef(0);
  const isInitialMount = useRef(true);

  const location = useLocation();
  useEffect(() => {
    const newPath = location.pathname + location.search;
    setPathname(newPath);
  }, [location.pathname, location.search]);

  const memoizedActiveView = useMemo(() => {
    return Object.values(Documents)
      .filter(doc => doc.active)
      .map(doc => {
        const { View } = doc;
        return View && <View Document={doc.Document} key={doc.key} />;
      });
  }, [Documents]);

  const [openNav, setOpenNav] = usePersist(__WORKSPACE_NAME__);
  const ActiveView = useMemo(() => memoizedActiveView, [memoizedActiveView, refreshFlag]);

  const handleSetOpenNav = useCallback((newOpenNav) => {
    setOpenNav(newOpenNav);
  }, [setOpenNav]);

  const handleToogleSidebarNav = useCallback(() => {
    setOpenNav(prev => !prev);
  }, [setOpenNav]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const detect = () =>
      window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    if (!storedTheme || storedTheme === "system") {
      setStoredTheme(detect());
      setStoredSource("auto");
      return;
    }

    if (!storedSource) {
      setStoredSource("manual");
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (storedSource !== "auto") return;

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e) => setStoredTheme(e.matches ? "dark" : "light");

    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [storedSource, setStoredTheme]);
  
  useEffect(() => {
    if (typeof window === "undefined") return;
    const resolved =
      storedTheme === "light" || storedTheme === "dark"
        ? storedTheme
        : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(resolved);
  }, [storedTheme, pathname]);

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
    const cache = metaCacheRef.current;
    let __META__ = {};

    if (cache[r.instance]) {
      __META__ = cache[r.instance];
      __META__.Document = { ...cache[r.instance].Document, ...r }
    } else {
      __META__ = {
        key: r.key,
        Document: r,
      }
      cache[r.instance] = __META__
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
    const preloadedMeta = !!metaCacheRef.current[loopar.utils.urlInstance(route)];

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

  /**
   * Re-fetch the active document.
   *
   * @param {{ force?: boolean }} [opts]
   *   force:true => invalidates metaCacheRef before the fetch. This makes
   *     fetchDocument send `preloaded=false` and the server returns the
   *     complete meta (not just data), refreshing fields, permissions,
   *     enabled actions, etc. This is the semantics of `loopar.reload()`.
   *   force:false (default) => maintains the cache; the server usually
   *     responds with lightweight data (preloaded=true) and a shallow merge.
   *     This is the semantics of `loopar.refresh()`.
   */
  const refresh = useCallback((opts = {}) => {
    if (opts.force) metaCacheRef.current = {};
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
    if (storedTheme === "light" || storedTheme === "dark") return storedTheme;

    const cookieTheme = loopar.cookie.get(storageKey);
    if (cookieTheme === "light" || cookieTheme === "dark") return cookieTheme;

    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "dark";
  }, [storedTheme, storageKey]);

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
    award,
    user: __META__.user
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