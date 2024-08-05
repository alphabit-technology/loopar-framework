import { useContext, createContext} from 'react';

export const DroppableContext = createContext({
  droppable: false,
  setDroppable: () => {},
  __REFS__: {},
  dragging: false,
  handleDragging: () => {}
});

export const useDroppable = () => useContext(DroppableContext);
