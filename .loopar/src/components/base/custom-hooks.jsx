import exp from 'constants';
import React, { useContext, createContext, useEffect, useState} from 'react';

export const DesignerContext = createContext({
  designerMode: false,
  designerRef: null,
  toggleDesign: () => {},
  design: false,
});

export const useDesigner = () => useContext(DesignerContext);

export const HiddenContext = createContext(false);
export const useHidden = () => useContext(HiddenContext);
export const MediaQueryContext = createContext();

// Modificación del hook useMediaQuery para ser seguro en SSR
const useMediaQuery = (query) => {
  // Estado inicial falso, considerando que no sabemos el tamaño de la pantalla en el servidor
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Verificar si window está definido para evitar errores en SSR
    if (typeof window !== 'undefined') {
      const mediaQueryList = window.matchMedia(query);
      const listener = (e) => setMatches(e.matches);
      // Configurar listener
      mediaQueryList.addListener(listener);
      // Establecer valor inicial basado en la consulta
      setMatches(mediaQueryList.matches);

      // Limpiar listener al desmontar componente
      return () => mediaQueryList.removeListener(listener);
    }else{

    }
  }, [query]);

  return matches;
};

// Crear un proveedor del contexto
export const MediaQueryProvider = ({ children }) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isMedium = useMediaQuery('(max-width: 1024px)');

  return (
    <MediaQueryContext.Provider value={{ screenSize: isMobile ? "sm" : isMedium ? "md" : "lg" }}>
      {children}
    </MediaQueryContext.Provider>
  );
};

export const DocumentContext = createContext({
  mode: "preview", // "preview" | "design" | "editor"
  toggleMode: () => {},
  editElement: null,
  setEditElement: () => {},
});

export const useDocument = () => useContext(DocumentContext);