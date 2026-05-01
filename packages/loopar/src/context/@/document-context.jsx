import { useContext, createContext, useMemo, useCallback } from 'react';
import { useCookies } from "@services/cookie";

export const DocumentContext = createContext({
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const DocumentProvider = ({ children, docRef, name, title, formValues, spacing, Document, slots, ...props }) => {
  const [sidebarOpen, setSidebarOpen] = useCookies(name + "sidebarOpen");

  /** Stable handler reference so the provider value does not change every render. */
  const handleSetSidebarOpen = useCallback((value) => {
    setSidebarOpen(value);
  }, [setSidebarOpen]);

  /**
   * Memoized provider value. Without `useMemo` this would be a fresh literal on
   * every render and invalidate every downstream `useDocument()` consumer.
   */
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
