/**
 * Per-document registry of rendered fields:
 *   refs — live ref of each rendered field (no re-render).
 *   meta — runtime overrides of a field (`hidden`, `onChange`...) as immutable
 *          snapshots with subscribers; `useFieldMeta()` re-renders one field only.
 */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

export function createFieldStore() {
  const refs = new Map();
  const listeners = new Set();
  let meta = {};
  let batching = 0;
  let dirty = false;

  const emit = () => {
    if (batching) { dirty = true; return; }
    for (const l of listeners) l();
  };

  const store = {
    /* ------------------------------------------------------------ refs */
    registerRef(name, ref) {
      if (!name) return;
      if (ref === null || ref === undefined) refs.delete(name);
      else refs.set(name, ref);
    },
    unregisterRef(name) { refs.delete(name); },
    getRef(name) { return refs.get(name); },
    hasRef(name) { return refs.has(name); },

    /* ------------------------------------------------------------ meta */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getMeta() { return meta; },
    getFieldMeta(name) { return meta[name]; },

    setMeta(name, patch) {
      if (!name) return;
      meta = { ...meta, [name]: { ...(meta[name] || {}), ...patch } };
      emit();
    },
    setMetaData(name, attr, value) {
      const current = meta[name]?.data || {};
      store.setMeta(name, { data: { ...current, [attr]: value } });
    },
    on(name, event, callback) {
      store.setMeta(name, { ["on" + capitalize(event)]: callback });
    },
    off(name, event) {
      const key = "on" + capitalize(event);
      if (!meta[name] || !(key in meta[name])) return;
      const { [key]: _, ...rest } = meta[name];
      meta = { ...meta, [name]: rest };
      emit();
    },
    batch(fn) {
      batching++;
      try { fn(); } finally {
        batching--;
        if (!batching && dirty) { dirty = false; emit(); }
      }
    },
    reset() {
      refs.clear();
      meta = {};
      emit();
    },
  };

  return store;
}
