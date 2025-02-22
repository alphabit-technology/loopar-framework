import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
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
        if(Array.isArray(Document.__DOCUMENT__.__ENTITY__.STRUCTURE)) {} else{
          console.log([Document.__DOCUMENT__, "Document.__DOCUMENT__.__ENTITY__.STRUCTURE", Document.__DOCUMENT__.__ENTITY__.STRUCTURE]);
        }
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

  }, [Documents, pathname]);

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
    activeModule
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