/**
 * Single source of truth for metaFields defaults.
 *
 * The element editor used to be the only place where `default_value` from a
 * component's metaFields() was merged into the element data. That meant the
 * base render (SSR, public page and the designer on load) never saw those
 * defaults — e.g. feature-card's icon block was discarded until the editor
 * mounted and wrote the merged data back. These helpers let any render path
 * (Meta.jsx) and the editor derive the same defaults from the same metaFields.
 */

const componentDefaultsCache = new WeakMap();

const isMissing = (v) => v === undefined || v === null || v === "";

/**
 * Collects { field: default_value } from metaFields groups, tolerating the
 * nested-array shapes used across components:
 *   [{ group, elements }] | [[{ group, elements }]] | ...
 */
export function getDefaultsFromMetaFields(groups) {
  const defaults = {};

  const walk = (g) => {
    if (!g) return;
    if (Array.isArray(g)) {
      g.forEach(walk);
      return;
    }
    for (const [field, def] of Object.entries(g.elements || {})) {
      const dv = def?.data?.default_value;
      if (dv !== undefined && dv !== "") defaults[field] = dv;
    }
  };

  walk(groups);
  return defaults;
}

/**
 * Defaults declared by a component via metaFields(), cached per component
 * (metaFields definitions are static). Returns null when the component
 * declares none.
 */
export function getMetaDefaults(Comp) {
  if (!Comp || typeof Comp.metaFields !== "function") return null;

  if (componentDefaultsCache.has(Comp)) return componentDefaultsCache.get(Comp);

  let defaults = null;
  try {
    const collected = getDefaultsFromMetaFields(Comp.metaFields());
    defaults = Object.keys(collected).length > 0 ? collected : null;
  } catch {
    // metaFields() may depend on designer-only globals in exotic setups;
    // rendering must never break because defaults could not be derived.
    defaults = null;
  }

  componentDefaultsCache.set(Comp, defaults);
  return defaults;
}

/**
 * Returns `data` with the component's metaFields defaults filled in for
 * missing fields (undefined / null / ""). Explicit values are never
 * overwritten — including falsy ones like `false` or `0`. Returns the same
 * object when nothing needs to change.
 */
export function applyMetaDefaults(Comp, data) {
  const defaults = getMetaDefaults(Comp);
  if (!defaults) return data;

  let out = data;
  for (const [field, value] of Object.entries(defaults)) {
    if (!isMissing(out?.[field])) continue;
    if (out === data) out = { ...(data || {}) };
    out[field] = value;
  }

  return out;
}
