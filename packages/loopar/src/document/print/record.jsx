import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import loopar from "loopar";

/**
 * The record being printed, for print elements (doc_field, doc_table,
 * letterhead…) placed anywhere in a format:
 *
 *   { Document, data, fields: Map<name, structure node>, letterhead }
 *
 * Provided by <PrintLayout>. Outside a print (the designer) there is no
 * record: print elements render a design placeholder instead.
 */
const PrintRecordContext = createContext(null);

export function PrintRecordProvider({ value, children }) {
  return <PrintRecordContext.Provider value={value}>{children}</PrintRecordContext.Provider>;
}

export const usePrintRecord = () => useContext(PrintRecordContext);

/** name → structure node (element + data + __META__) of a doc_structure. */
export function indexFields(structure = []) {
  const map = new Map();
  const walk = (nodes) => (nodes || []).forEach((node) => {
    if (node?.data?.name && node.element) map.set(node.data.name, node);
    walk(node?.elements);
  });
  walk(structure);
  return map;
}

/* letterhead */
const letterheadCache = new Map();
const letterheadRequests = new Map();

function fetchLetterhead(key, name) {
  if (!letterheadRequests.has(key)) {
    letterheadRequests.set(key,
      loopar.call("Letterhead", "current", { query: name ? { name } : {}, freeze: false })
        .then((r) => r?.letterhead || null)
        .catch(() => null)
        .then((lh) => { letterheadCache.set(key, lh); return lh; })
    );
  }
  return letterheadRequests.get(key);
}

export function useLetterhead(name = null) {
  const record = usePrintRecord();
  const fromPrint = record ? record.letterhead ?? null : undefined;
  const key = name || "__default__";
  const [fetched, setFetched] = useState(() => letterheadCache.get(key));

  useEffect(() => {
    if (fromPrint !== undefined || letterheadCache.has(key)) return;
    let alive = true;
    fetchLetterhead(key, name).then((lh) => alive && setFetched(lh));
    return () => { alive = false; };
  }, [fromPrint, key, name]);

  return fromPrint !== undefined ? fromPrint : fetched;
}

/* design store */
let design = { entity: null, fields: [] };
const listeners = new Set();

export function setPrintDesignFields(entity, fields = []) {
  design = { entity, fields: Array.isArray(fields) ? fields : [] };
  listeners.forEach((l) => l());
}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => design;

export const usePrintDesign = () => useSyncExternalStore(subscribe, snapshot, snapshot);
export const getPrintDesign = () => design;

/**
 * Select options ("name:Label" per line) for a print element's field picker.
 * `tables`: true → child tables only, false → plain fields only.
 * Always multi-line so the select treats them as inline options.
 */
export function printDesignFieldOptions({ tables = false } = {}) {
  const lines = design.fields
    .filter((f) => !!f.table === tables)
    .map((f) => `${f.name}:${f.label}`);
  return ["", ...lines].join("\n");
}
