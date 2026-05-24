import { useContext, createContext, useMemo, useCallback } from 'react';
import { usePersist } from "@services/persist-state";

export const DocumentContext = createContext({
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const DocumentProvider = ({ children, docRef, name, title, formValues, spacing, Document, slots, ...props }) => {
  const [sidebarOpen, setSidebarOpen] = usePersist(name + "sidebarOpen");

  const handleSetSidebarOpen = useCallback((value) => {
    setSidebarOpen(value);
  }, [setSidebarOpen]);

  const value = useMemo(() => ({
    docRef,
    name,
    sidebarOpen,
    entity: Document.Entity.name,
    Document,
    entityMenu: Document.__DOCUMENT_TITLE__,
    documentWidth: 'lg:w-[calc(100%-300px)] w-full',
    sidebarWidth: 'w-[300px]',
    handleSetSidebarOpen,
    formValues,
    spacing,
    slots
  }), [docRef, name, sidebarOpen, Document, handleSetSidebarOpen, formValues, spacing, slots]);

  return (
    <DocumentContext.Provider value={value}>
      <>
        {children}
      </>
    </DocumentContext.Provider>
  );
}

export const useDocument = () => useContext(DocumentContext);
