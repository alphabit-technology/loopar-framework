import { useContext, createContext } from 'react';
import { useCookies } from "@services/cookie";
import { DragGhost } from "./drag-ghost";

export const DroppableWrapper = ({ children, ...props }) => {
  const [dropping, setDropping] = useState(false);
  const [currentDragging, setCurrentDragging] = useState(null);


  const handleSetSidebarOpen = (value) => {
    setSidebarOpen(value);
  }
  
  return (
    <>
      {dropping && currentDragging && <DragGhost />}
      <>
        {children}
      </>
    </>
  );
}

export const useDocument = () => useContext(DocumentContext);