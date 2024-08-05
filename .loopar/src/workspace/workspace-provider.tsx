import React, { createContext, useContext, useEffect, useState, useCallback } from "react"
import { loopar } from "loopar";
import { useLocation } from 'react-router-dom';
import {useCookies} from "@services/cookie";
import { AppSourceLoader } from "$/app-source-loader";

const usePathname = () => {
  return useLocation().pathname;
};

type Theme = "dark" | "light" | "system"

type Module = {
  default: React.FC<any>
}

interface Meta {
  __DOCTYPE__: {},
  __DOCUMENT__: {},
  __META__: {},
  key: string,
  client_importer: {},
}

interface __META__ {
  workspace: string;
  meta: Meta;
  key: string;
  client_importer: {};
  W: string;
}

interface Document {
  Module: Module,
  meta: Meta,
  active: boolean
}

interface Documents {
  [key: string]: Document
}

interface Res {
  meta: Meta,
  key: string,
  client_importer: {}
}

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
  currentLink?: string,
  ENVIRONMENT?: string
}

type WorkspaceProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void,
  openNav?: boolean,
  setOpenNav?: (open: boolean) => void,
  Documents: Documents,
  setDocuments: (Documents: Documents) => void
}

const initialState: WorkspaceProviderState = {
  theme: "system",
  setTheme: () => null,
  openNav: loopar.cookie.get("openNav"),
  setOpenNav: () => null,
  Documents: {},
  setDocuments: () => null
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
      if (Document.meta.__DOCTYPE__ && Document.meta.__DOCUMENT__) {
        Document.meta.__DOCTYPE__.STRUCTURE = updateValue(
          JSON.parse(Document.meta.__DOCTYPE__.doc_structure),
          Document.meta.__DOCUMENT__
        );
      }
    });

    return toMergeDocuments || [];
  }

  const getDocuments = () => {
    return (
      <>
        {getMergeDocument().map((Document: Document) => {
          const { Module, meta, active } = Document;
          return active && Module ? <Module meta={meta} key={meta.key}/> : null;
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

  const setDocument = (__META__: Meta) => {
    const copyDocuments = { ...Documents };
    const res = __META__ || {} as Meta;

    Object.values(copyDocuments).forEach((Document) => {
      Document.active = false;
    });

    res.meta.key = res.key;

    if (!copyDocuments[res.key]) {
      AppSourceLoader(res.client_importer).then((Module: Module) => {
        copyDocuments[res.key] = {
          Module: Module.default,
          meta: res.meta,
          active: true,
        };

        handleSetDocuments(copyDocuments);
      }).catch((e) => {
        res.client_importer.client = "error-view";

        AppSourceLoader(res.client_importer).then((Module: Module) => {
          res.meta.__DOCUMENT__ = {
            code: 500,
            description: e.message
          };

          copyDocuments[res.key] = {
            Module: Module.default,
            meta: res.meta,
            active: true,
          };

          handleSetDocuments(copyDocuments);
        });
      });
    } else {
      copyDocuments[res.key] = {
        Module: Documents[res.key].Module,
        meta: res.meta,
        active: true,
      };

      handleSetDocuments(copyDocuments);
    }
  }

  const fetch = (url) => {
    const route = window.location;

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
    workspace: props.workspace,
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
    currentPage: props.currentPage,
    currentLink: props.currentLink,
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
