import { useCallback, useContext, useSyncExternalStore } from 'react';
import PersistStateContext from './persist-state-context';

/** Stable no-op subscription for the (unexpected) no-provider case. */
const noopSubscribe = () => () => {};

/**
 * @param {string} key - Unique key within the workspace.
 * @param {*} [defaultValue] - Value to report when the key was never set.
 * @returns {[*, (next:*|((prev:*)=>*)) => void]} `[value, setValue]`
 */
export default function usePersistState(key, defaultValue) {
  const store = useContext(PersistStateContext);
  const subscribe = store ? store.subscribe : noopSubscribe;

  const getSnapshot = useCallback(
    () => (store ? store.get(key) : undefined),
    [store, key]
  );

  const raw = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const value = raw === undefined ? defaultValue : raw;

  const setValue = useCallback(
    (next) => {
      if (!store) {
        console.warn(
          '[usePersistState] used outside <PersistStateProvider>; value not persisted'
        );
        return;
      }
      store.set(key, typeof next === 'function' ? next(store.get(key)) : next);
    },
    [store, key]
  );

  return [value, setValue];
}
