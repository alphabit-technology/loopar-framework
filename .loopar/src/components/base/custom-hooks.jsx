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
});
export const useDesigner = () => useContext(DesignerContext);



export const DroppableContext = createContext({
  droppable: false,
  setDroppable: () => {},
  __REFS__: {},
  dragging: false,
  handleDragging: () => {}
});
export const useDroppable = () => useContext(DroppableContext);

export const DraggableContext = createContext({
  dragging: false,
  handleDragging: () => {}
});
export const useDraggable = () => useContext(DraggableContext);

export const HiddenContext = createContext(false);
export const useHidden = () => useContext(HiddenContext);

export const DocumentContext = createContext({
  mode: "preview", // "preview" | "design" | "editor"
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const useDocument = () => useContext(DocumentContext);