import React, { useRef } from 'react';
import PersistStateContext from './persist-state-context';
import { createPersistStateStore } from './persist-state-store';

/**
 * Provides the persist-state store to the tree.
 * @param {Object} props
 * @param {string} props.workspace - Current workspace name (`__META__.name`).
 * @param {Object} [props.cookieManager] - Server cookie manager, present only
 * during SSR.
 */
export default function PersistStateProvider({ workspace, cookieManager, children }) {
  const storeRef = useRef(null);

  if (storeRef.current === null) {
    storeRef.current = createPersistStateStore({
      workspace,
      serverManager: cookieManager,
    });
  }

  return (
    <PersistStateContext.Provider value={storeRef.current}>
      {children}
    </PersistStateContext.Provider>
  );
}
