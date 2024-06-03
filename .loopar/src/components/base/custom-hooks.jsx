import { useContext, createContext} from 'react';

export const DesignerContext = createContext({
  designerMode: false,
  designerRef: null,
  toggleDesign: () => {},
  design: false,
});

export const useDesigner = () => useContext(DesignerContext);

export const HiddenContext = createContext(false);
export const useHidden = () => useContext(HiddenContext);

export const DocumentContext = createContext({
  mode: "preview", // "preview" | "design" | "editor"
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const useDocument = () => useContext(DocumentContext);