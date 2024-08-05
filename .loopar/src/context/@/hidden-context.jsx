import { useContext, createContext} from 'react';

export const HiddenContext = createContext(false);
export const useHidden = () => useContext(HiddenContext);