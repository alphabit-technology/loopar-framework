import { useContext, createContext} from 'react';

export const DesignerContext = createContext({
  designerMode: false,
  designerRef: null,
  toggleDesign: () => {},
  design: false,
  currentDropZone: null,
  setCurrentDropZone: () => {},
  currentDragging: null,
  setCurrentDragging: () => {},
  dropping: false,
  setDropping: () => {},
  movement: null,
  setMovement: () => {},
});

export const useDesigner = () => useContext(DesignerContext);