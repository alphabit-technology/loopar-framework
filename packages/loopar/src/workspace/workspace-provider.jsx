import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, useTransition } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router';
import { useCookies } from "@services/cookie";
import { usePersist } from "@services/persist-state";
import { AppSourceLoader } from "@loopar/loader";
import {useAuth} from "@context/AuthContext"
import Emitter from "@services/emitter/emitter";
import { LoopSocket } from "@services/realtime/LoopSocket";

/** Read the current public session (JWT is httpOnly → ask the server). */
async function fetchSession() {
  try {
    const r = await fetch("/auth/me", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest" },
      body: "{}",
    }).then((x) => x.json());
    return r?.logged ? r : null;
  } catch {
    return null;
  }
}

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

  // Reactive session: seeded from SSR, refreshed in place on auth changes.
  const [user, setUser] = useState(__META__.user || null);

  // A secondary provider (modal mini-workspace) reuses render + navigation,
  // but only the PRIMARY touches global singletons (workspace bind, session,
  // socket, window.__user__).
  const primary = props.primary !== false;
  const onClose = props.onClose; 
  const seeded = Object.keys(props.Documents || {}).length > 0;

  // Singleton binds — only the provider knows the active workspace and
  // session, so only it pushes them into `loopar`.
  useEffect(() => {
    if (!primary) return;
    loopar._bindWorkspace(__WORKSPACE_NAME__);
  }, [__WORKSPACE_NAME__, primary]);

  useEffect(() => {
    if (!primary) return;
    loopar._bindSession(user);
  }, [user, primary]);
  useEffect(() => {
    if (!primary) return;
    const onAuthChanged = () => { fetchSession().then(setUser); };
    Emitter.on("auth:changed", onAuthChanged);
    return () => Emitter.off("auth:changed", onAuthChanged);
  }, [primary]);

  // Realtime: connect to this tenant's namespace (`__META__.site`); identity
  // comes from the httpOnly JWT. Without this call nothing ever connects and
  // useRealtime()'s onReady callbacks queue forever.
  useEffect(() => {
    if (!primary) return;
    const site = __META__.site;
    if (!site) return;
    LoopSocket.connect(site);
  }, [__META__.site, primary]);

  // useRealtime({ ignoreSelf }) compares payload.user vs window.__user__;
  // keep it in sync with the session.
  useEffect(() => {
    if (!primary) return;
    if (typeof window !== "undefined") {
      window.__user__ = user?.userId || user?.name || null;
    }
  }, [user, primary]);

  const metaCacheRef = useRef({});
  const lastFetchedPath = useRef(null);
  const fetchIdRef = useRef(0);
  const isInitialMount = useRef(true);

  const location = useLocation();
  useEffect(() => {
    // Only the primary follows the browser URL; a modal drives its pathname locally.
    if (!primary) return;
    const newPath = location.pathname + location.search;
    setPathname(newPath);
  }, [location.pathname, location.search, primary]);

  // Navigation for consumers: primary → the real URL/router; a modal advances
  // its own in-memory path, never touching the browser URL.
  const navigate = useCallback((to) => {
    if (primary) return loopar.navigate(to);
    setPathname(typeof to === "string" ? to : String(to ?? ""));
  }, [primary]);

  const memoizedActiveView = useMemo(() => {
    // `inModal` lets a View skip full-page behaviour (e.g. URL normalizing,
    // which from a modal would navigate the base page away).
    return Object.values(Documents)
      .filter(doc => doc.active)
      .map(doc => {
        const { View } = doc;
        return View && <View Document={doc.Document} inModal={!primary} onClose={onClose} key={doc.key} />;
      });
  }, [Documents, primary, onClose]);

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
    const Document = {
      key: "error-view",
      entryPoint: "error-view",
      data: {
        code: e.code || 404,
        title: e.title || "Source not found",
        description: e.message
      }
    };

    AppSourceLoader(Document).then((Module) => {
      startTransition(() => {
        setDocuments(prevDocuments => {
          const updatedDocuments = { ...prevDocuments };
          Object.values(updatedDocuments).forEach((doc) => {
            doc.active = false;
          });

          updatedDocuments[Document.key] = {
            View: Module.default,
            key: Document.key,
            Document,
            active: true,
          };

          return updatedDocuments;
        });
      });
    });
  }, []);

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
    // Works off the path string alone (router location for the base,
    // in-memory path for a modal) — one code path, no second <Router>.
    const raw = String(url ?? '');
    if (raw.includes('#')) return Promise.resolve();

    const [rawPath, rawSearch = ''] = raw.split('?');
    const targetPath = rawPath || '/';
    const targetSearch = rawSearch ? `?${rawSearch}` : '';

    const currentFetchId = ++fetchIdRef.current;
    const preloadedMeta = !!metaCacheRef.current[loopar.utils.urlInstance({ pathname: targetPath })];

    // The ONLY request that names a workspace (as a parameter) — RPCs never send one.
    const queryParams = Object.fromEntries(new URLSearchParams(targetSearch));

    return new Promise((resolve, reject) => {
      loopar.fetchDocument(targetPath, {
        workspace: __WORKSPACE_NAME__,
        query: { ...queryParams, preloaded: preloadedMeta },
        success: r => {
          if (currentFetchId !== fetchIdRef.current) return;
          lastFetchedPath.current = raw;
          setDocument(r);
          resolve();
        },
        error: e => {
          if (currentFetchId !== fetchIdRef.current) return;
          lastFetchedPath.current = raw;
          goToErrorView(e);
          resolve();
        }
      });
    });
  }, [setDocument, goToErrorView, __WORKSPACE_NAME__]);

  /**
   * Re-fetch the active document. force:true clears the meta cache so the
   * server returns full meta — fields, permissions, actions (`loopar.reload()`);
   * default keeps it and gets lightweight data + shallow merge (`loopar.refresh()`).
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
    
    if (!lastFetchedPath.current && seeded) {
      lastFetchedPath.current = pathname;
    }
  }, []);

  useEffect(() => {
    if (!loaded) return;

    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (seeded) return;   // not seeded (modal) → fall through and fetch the initial path
    }

    if (lastFetchedPath.current === pathname) return;

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
    user,
    navigate,
    isModal: !primary,
    onClose
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
    award,
    user
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