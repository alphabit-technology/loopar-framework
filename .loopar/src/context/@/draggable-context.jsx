import { useContext, createContext} from 'react';

export const DraggableContext = createContext({
  dragging: false,
  handleDragging: () => {}
});

export const useDraggable = () => useContext(DraggableContext);
