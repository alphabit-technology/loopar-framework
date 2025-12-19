import { useContext, useState, useCallback } from 'react';
import CookiesContext from './context';

export default function useCookies(name) {
  const manager = useContext(CookiesContext);

  if (!manager) {
    throw new Error('Missing <CookiesProvider>');
  }

  const [value, setValue] = useState(() => 
    name ? manager.get(name) : manager.getAll()
  );

  const setCookie = useCallback((newValue) => {
    const resolvedValue = typeof newValue === 'function' 
      ? newValue(value) 
      : newValue;
    
    if (name) {
      manager.set(name, resolvedValue);
    } else {
      manager.set(resolvedValue);
    }
    setValue(resolvedValue);
  }, [manager, name, value]);

  return [value, setCookie];
}