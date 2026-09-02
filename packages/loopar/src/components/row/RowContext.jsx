import { useContext, createContext } from 'react';

export const RowContext = createContext({
  gap: 1,
  colPadding: "p-0",
});

export const RowContextProvider = ({ children, gap, colPadding }) => {
  return (
    <RowContext.Provider value={{
      gap,
      colPadding,
    }}>
      {children}
    </RowContext.Provider>
  );
}

export const useRowContext = () => useContext(RowContext);
