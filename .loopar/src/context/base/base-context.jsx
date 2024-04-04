import React, { createContext, useContext } from 'react';

export const DocumentContext = createContext();
export const useDocumentContext = () => useContext(DocumentContext);
