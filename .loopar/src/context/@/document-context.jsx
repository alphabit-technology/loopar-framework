import { useContext, createContext } from 'react';
import { useCookies } from "@services/cookie";

export const DocumentContext = createContext({
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const DocumentProvider = ({ children, docRef, name, formValues, ...props }) => {
  const [sidebarOpen, setSidebarOpen] = useCookies(name + "sidebaeOpen");

  const handleSetSidebarOpen = (value) => {
    setSidebarOpen(value);
  }

  return (
    <DocumentContext.Provider value={{
      docRef, name, sidebarOpen,
      documentWidth: 'lg:w-[calc(100%-300px)] w-full',
      sidebarWidth: 'w-[300px]',
      handleSetSidebarOpen,
      formValues
    }}>
      {children}
    </DocumentContext.Provider>
  );
}

export const useDocument = () => useContext(DocumentContext);