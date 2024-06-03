import { createContext, useContext } from 'react';

export const DocumentContext = createContext();
export const useDocumentContext = () => useContext(DocumentContext);
