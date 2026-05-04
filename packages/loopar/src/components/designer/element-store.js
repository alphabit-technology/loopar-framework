import { createContext, useCallback, useContext, useRef, useSyncExternalStore } from "react";
import { getNodeKey } from "@global/prune-doc-structure";

export class ElementStore {
  constructor() {
    this.dataMap = new Map();
    this.listeners = new Map();
  }

  get(key) {
    return this.dataMap.get(key);
  }

  set(key, data) {
    this.dataMap.set(key, data);
    const ls = this.listeners.get(key);
    if (ls) ls.forEach((l) => l());
  }

  update(key, partial, merge = true) {
    const prev = this.dataMap.get(key) ?? {};
    const next = merge ? { ...prev, ...partial } : { ...partial };
    this.set(key, next);
  }

  populate(elements) {
    for (const el of elements || []) {
      const key = getNodeKey(el);
      if (key) {
        this.dataMap.set(key, el.data);
      }
      if (el?.elements) this.populate(el.elements);
    }
  }

  subscribe(key, listener) {
    let set = this.listeners.get(key);
    if (!set) {
      set = new Set();
      this.listeners.set(key, set);
    }
    set.add(listener);
    return () => set.delete(listener);
  }

  reconcileTree(elements) {
    if (!elements) return elements;
    let changed = false;
    const next = elements.map((el) => {
      const k = getNodeKey(el);
      const live = k ? this.dataMap.get(k) : null;
      const newData = live && live !== el.data ? live : el.data;
      const newChildren = this.reconcileTree(el?.elements);
      if (newData === el.data && newChildren === el?.elements) return el;
      changed = true;
      return { ...el, data: newData, elements: newChildren };
    });
    return changed ? next : elements;
  }
}

export const ElementStoreContext = createContext(null);

const noopUnsubscribe = () => {};

export function useElementData(key, fallback) {
  const store = useContext(ElementStoreContext);
  const fallbackRef = useRef(fallback);
  fallbackRef.current = fallback;

  const subscribe = useCallback(
    (listener) => (store && key ? store.subscribe(key, listener) : noopUnsubscribe),
    [store, key]
  );

  const getSnapshot = useCallback(
    () => (store && key ? store.get(key) : null) ?? fallbackRef.current,
    [store, key]
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
