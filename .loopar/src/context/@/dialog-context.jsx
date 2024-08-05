import { useContext, createContext} from 'react';

export const DialogContext = createContext({});

export const useDialog = () => useContext(DialogContext);