import { useSyncExternalStore } from "react";

const noop = () => () => {};

/** Reactive runtime meta of one field (see controller/field-store.js). */
export function useFieldMeta(fields, name) {
  const read = () => (fields && name ? fields.getFieldMeta(name) : undefined);
  return useSyncExternalStore(fields ? fields.subscribe : noop, read, read);
}
