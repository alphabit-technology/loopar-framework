/**
 * Copies every own property of `source` onto `target` preserving accessors
 * (getters/setters), which `Object.assign` would flatten into values.
 * Used to share one implementation between the hook-based controllers and
 * the legacy class adapters (`BaseDocument` / `BaseForm`).
 */
export function mixin(target, source) {
  if (!source) return target;
  for (const key of Reflect.ownKeys(source)) {
    Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
  }
  return target;
}
