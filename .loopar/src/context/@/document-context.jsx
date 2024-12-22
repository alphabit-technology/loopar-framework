import { useContext, createContext} from 'react';

export const DocumentContext = createContext({
  mode: "preview", // "preview" | "design" | "editor"
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const useDocument = () => useContext(DocumentContext);