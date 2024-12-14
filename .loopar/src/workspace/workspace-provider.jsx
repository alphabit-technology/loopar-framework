import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router-dom';
import { useCookies } from "@services/cookie";
import { AppSourceLoader } from "@loader";

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
  activeParentMenu: "",
  setActiveParentMenu: () => null,
  activePage: "",
  setActivePage: () => null
}

export const WorkspaceProviderContext = createContext(initialState)

export function WorkspaceProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}) {
  const pathname = usePathname();

  const [theme, setTheme] = useState(
    () => (loopar.cookie.get(storageKey)) || defaultTheme
  );

  const __META__ = props.__META__ || {}
  const __DOCUMENT__ = __META__.__DOCUMENT__ || {}
  const __WORKSPACE_NAME__ = __META__.__WORKSPACE__?.name || "desk"

  const [Documents, setDocuments] = useState(props.Documents || {});
  const [loaded, setLoaded] = useState(false);
  const [activeParentMenu, setActiveParentMenu] = useState(__DOCUMENT__?.activeParentMenu || __DOCUMENT__?.__ENTITY__?.name);
  const [activePage, setActivePage] = useState(props.activePage || "");

  const getMergeDocument = () => {
    const toMergeDocuments = Object.values({ ...Documents });

    const updateValue = (structure, Document) => {
      return structure.map((el) => {
        if (Object.keys(Document).includes(el.data?.name)) {
          const value = Document[el.data.name];

          el.data.value = value;
        }

        el.elements = updateValue(el.elements || [], Document);
        return el;
      });
    };

    toMergeDocuments.forEach((Document) => {
      if (Document.__DOCUMENT__?.__ENTITY__) {
        Document.__DOCUMENT__.__ENTITY__.STRUCTURE ??= JSON.parse(Document.__DOCUMENT__.__ENTITY__.doc_structure);
        Document.__DOCUMENT__.__ENTITY__.STRUCTURE = updateValue(
          Document.__DOCUMENT__.__ENTITY__.STRUCTURE,
          Document.__DOCUMENT__.__DOCUMENT__
        );
      }
    });

    return toMergeDocuments || [];
  }

  const getDocuments = () => {
    return (
      <>
        {getMergeDocument().map((Document) => {
          const { Module, __DOCUMENT__, active } = Document;
          return active && Module ? <Module meta={__DOCUMENT__} key={__DOCUMENT__.key} /> : null;
        })}
      </>
    );
  }

  const [openNav, setOpenNav] = useCookies(__WORKSPACE_NAME__);

  const handleSetOpenNav = useCallback(openNav => {
      setOpenNav(openNav);
    },
    [openNav]
  );

  const handleToogleSidebarNav = useCallback(
    () => {
      console.log("toogleSidebarNav");
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

  useEffect(() => {
    const active = Object.values(Documents).find((Document) => Document.active);
    
    if (!active) return;

    const { __DOCUMENT__ } = active;
    const activeParentMenu = __DOCUMENT__?.activeParentMenu || __DOCUMENT__?.__ENTITY__?.name;
   
    if (activeParentMenu){
      setActiveParentMenu(activeParentMenu);
      setActivePage(__DOCUMENT__?.__ENTITY__?.name);
    }

  }, [Documents, pathname]);

  

  const setDocument = (__META__) => {
    const copyDocuments = { ...Documents };

    Object.values(copyDocuments).forEach((Document) => {
      Document.active = false;
    });

    const setDocument = (Module) => {
      copyDocuments[__META__.key] = {
        Module: Module.default,
        __DOCUMENT__: __META__,
        active: true,
      };

      handleSetDocuments(copyDocuments);
    }

    AppSourceLoader(__META__.client_importer).then((Module) => {
      setDocument(Module);
    }).catch(e => {
      __META__.client_importer.client = "app/error-view";

      AppSourceLoader(__META__.client_importer).then((Module) => {
        __META__.__DOCUMENT__ = {
          code: 404,
          title: "Source not found",
          description: e.message
        };

        setDocument(Module);
      });
    });
  }

  const fetch = (url) => {
    const route = window.location;
    if(route.hash.includes("#"))  return;
    
    loopar.send({
      action: route.pathname,
      params: route.search,
      success: r => {
        setDocument(r)
      }
    });
  }

  useEffect(() => {
    loaded ? fetch(pathname) : setLoaded(true);
  }, [pathname]);

  const value = {
    theme,
    __META__,
    setTheme: (theme) => {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"

      loopar.cookie.set(storageKey, theme)
      setTheme(theme)
    },
    openNav,
    setOpenNav: handleSetOpenNav,
    toogleSidebarNav: handleToogleSidebarNav,
    menuItems: props.menuItems,
    activeParentMenu: activeParentMenu,
    ENVIRONMENT: props.ENVIRONMENT,
    Documents: Documents,
    getDocuments: getDocuments,
    activePage: activePage,
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