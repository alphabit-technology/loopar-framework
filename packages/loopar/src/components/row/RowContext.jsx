import { useContext, createContext } from 'react';

export const RowContext = createContext({
  spacing: 1,
  colPadding: "p-2",
  setEditElement: () => {},
});

export const RowContextProvider = ({ children, spacing, colPadding, colMargin }) => {
  return (
    <RowContext.Provider value={{
      spacing,
      colPadding,
      colMargin
    }}>
      {children}
    </RowContext.Provider>
  );
}

export const useRowContext = () => useContext(RowContext);