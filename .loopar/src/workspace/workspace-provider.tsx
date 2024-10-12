import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router-dom';
import { useCookies } from "@services/cookie";
import { AppSourceLoader } from "$/app-source-loader";

const usePathname = () => {
  return useLocation();
};

type Theme = "dark" | "light" | "system"

type Module = {
  default: React.FC<any>
}

type ClientImporter = {
  client: string,
  context: string,
}

interface __ENTITY__ {
  STRUCTURE: [],
  doc_structure: string,
}

interface Meta {
  __ENTITY__: __ENTITY__,
  __DOCUMENT__: {},
  __META__: {},
  key: string,
  client_importer: ClientImporter,
}

interface __META__ {
  workspace: string;
  meta: Meta;
  key: string;
  client_importer: ClientImporter;
  W: string;
}

interface Document {
  Module: Module,
  meta: Meta,
  active: boolean,
  __DOCUMENT__?: Meta,
  [key: string]: any, // Add this line to allow string indexing
}

interface Documents {
  [key: string]: Document
}

/*interface Res {
  meta: Meta,
  key: string,
  client_importer: ClientImporter,
}*/

interface Element {
  data: {
    name: string,
    value: string,
    key: string,
  },
  elements: Element[]
}

type WorkspaceProviderProps = {
  __META__?: __META__,
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string,
  workspace?: string,
  openNav?: boolean,
  menuItems?: [],
  currentPage?: string,
  ENVIRONMENT?: string
}

type WorkspaceProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void,
  openNav?: boolean,
  setOpenNav?: (open: boolean) => void,
  Documents: Documents,
  setDocuments: (Documents: Documents) => void,
  currentPage?: string,
  setCurrentPage?: (currentPage: string) => void,
}

const initialState: WorkspaceProviderState = {
  theme: "system",
  setTheme: () => null,
  openNav: loopar.cookie.get("openNav"),
  setOpenNav: () => null,
  Documents: {},
  setDocuments: () => null,
  currentPage: "",
  setCurrentPage: () => null,
}

export const WorkspaceProviderContext = createContext<WorkspaceProviderState>(initialState)

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

  const [Documents, setDocuments] = useState(props.Documents || {} as Documents);
  const [loaded, setLoaded] = useState(false);
  const [currentPage, setCurrentPage] = useState(props.currentPage || "");

  const getMergeDocument = () => {
    const toMergeDocuments = Object.values({ ...Documents });

    const updateValue = (structure: [], Document: Document) => {
      return structure.map((el: Element) => {
        if (Object.keys(Document).includes(el.data?.name)) {
          const value = Document[el.data.name];

          el.data.value = value;
        }

        el.elements = updateValue(el.elements || [], Document);
        return el;
      });
    };

    toMergeDocuments.forEach((Document: Document): void => {
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
        {getMergeDocument().map((Document: Document) => {
          const { Module, __DOCUMENT__, active } = Document;
          return active && Module ? <Module meta={__DOCUMENT__} key={__DOCUMENT__.key} /> : null;
        })}
      </>
    );
  }

  const [openNav, setOpenNav] = useCookies(props.workspace);

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

  /**
   * Document: [{
   *    module: Component (imported),
   *    meta: Meta data of Document,
   *    key: Unique key of Document based on URL,
   * }]
   * #param res
  */

  const handleSetDocuments = (Documents: Documents) => {
    setDocuments(Documents);
  }

  useEffect(() => {
    const active = Object.values(Documents).find((Document) => Document.active);
    
    if (!active) return;
    const { __DOCUMENT__ } = active;
    const currentPage = __DOCUMENT__?.__ENTITY__?.name
   
    currentPage && setCurrentPage(currentPage);
  }, [Documents, currentPage]);

  const setDocument = (__META__: Meta) => {
    const copyDocuments = { ...Documents };

    Object.values(copyDocuments).forEach((Document) => {
      Document.active = false;
    });

    const setDocument = (Module: Module) => {
      copyDocuments[__META__.key] = {
        Module: Module.default,
        __DOCUMENT__: __META__,
        active: true,
      };

      handleSetDocuments(copyDocuments);
    }

    AppSourceLoader(__META__.client_importer).then((Module: Module) => {
      setDocument(Module);
    }).catch(e => {
      __META__.client_importer.client = "app/error-view";

      AppSourceLoader(__META__.client_importer).then((Module: Module) => {
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
    __META__: props.__META__,
    //workspace: props.workspace,
    setTheme: (theme: Theme) => {
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
    currentPage,
    ENVIRONMENT: props.ENVIRONMENT,
    Documents: Documents,
    getDocuments: getDocuments
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
