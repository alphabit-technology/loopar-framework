import { loopar } from "loopar";
import * as preloadedIcons from "@app/auto/preloaded-icons";

class IconManager {
  constructor() {
    this.cache = new Map();
    this.inflight = new Map();
  }

  isPreloaded(name) {
    return Boolean(name && preloadedIcons[name]);
  }

  has(name) {
    return Boolean(name) && this.cache.has(name);
  }

  getCached(name) {
    if (!name) return null;
    return this.cache.get(name) ?? null;
  }

  prime(name, entry) {
    if (!name || !entry?.svg) return null;
    if (!this.cache.has(name)) {
      this.cache.set(name, {
        svg: entry.svg,
        source: entry.source ?? null,
        hex: entry.hex ?? null,
      });
    }
    return this.cache.get(name);
  }

  fetch(name) {
    if (!name) return Promise.resolve(null);
    if (this.cache.has(name)) return Promise.resolve(this.cache.get(name));
    if (this.inflight.has(name)) return this.inflight.get(name);

    const promise = (async () => {
      try {
        const r = await loopar.api.get("Icon Manager", "getSvg", {
          query: { name },
          freeze: false,
        });
        if (r?.svg) {
          const entry = {
            svg: r.svg,
            source: r.source ?? null,
            hex: r.hex ?? null,
          };
          this.cache.set(name, entry);
          return entry;
        }
        return null;
      } catch {
        return null;
      } finally {
        this.inflight.delete(name);
      }
    })();

    this.inflight.set(name, promise);
    return promise;
  }

  resolve(icon) {
    const value = icon?.value;
    if (!value) return null;

    if (icon.formattedValue && typeof icon.formattedValue === "string") {
      this.prime(value, {
        svg: icon.formattedValue,
        source: icon.source ?? null,
        hex: icon.hex ?? null,
      });
    }

    const cached = this.cache.get(value);
    if (cached) return cached;

    return this.fetch(value);
  }

  invalidate(name) {
    if (!name) return;
    this.cache.delete(name);
    this.inflight.delete(name);
  }

  clear() {
    this.cache.clear();
    this.inflight.clear();
  }
}

const iconManager = new IconManager();

export default iconManager;
export { IconManager };
