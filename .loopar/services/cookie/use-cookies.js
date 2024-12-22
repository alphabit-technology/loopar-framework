import { useContext } from 'react';
import CookiesContext from './context';

export default function useCookies(name, initialValue) {
  const manager = useContext(CookiesContext);

  if (!manager) {
    throw new Error('Missing <CookiesProvider>');
  }

  if (name) {
    return [manager.get(name), manager.set.bind(manager, name) || initialValue];
  }

  return [manager.getAll(), manager.set.bind(manager)];
}