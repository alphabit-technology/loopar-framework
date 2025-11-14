import React, { useState, useEffect, useContext, createContext, use } from 'react';
import { useLocation } from 'react-router';

const usePathname = () => {
  return useLocation();
};

const RouterContext = createContext();

export const RouterProvider = ({ children, ...props }) => {
  const pathname = usePathname();
  const [workSpace, setWorkSpace] = useState("desk");
  const [document, setDocument] = useState("");
  const [action, setAction] = useState("");

  const build = (pathname) => {
    const _pathname = pathname.pathname.replace(/^\//, "");
    const segments = _pathname.split("/");

    const workSpace = ["desk", "loopar", "auth"].includes(segments[0]) ? segments[0] : "web";
    const document = workSpace === "web" ? segments[0] : segments[1] || "";
    const action = workSpace === "web" ? segments[1] || "" : segments[2] || "";

    setWorkSpace(workSpace);
    setDocument(document);
    setAction(action);
  };

  useEffect(() => {
    build(pathname);
  }, [pathname]);

  return (
    <RouterContext.Provider value={{ workSpace, Document: document, action, ...props }}>
      {children}
    </RouterContext.Provider>
  );
}

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error("useRouter must be used within a RouterProvider");
  }
  return context;
}