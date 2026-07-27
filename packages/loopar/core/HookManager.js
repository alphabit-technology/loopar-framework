'use strict';

import { getTenant } from './server/router/request-context.js';

const EVENT_MAP = {
  beforeSave: ["beforeCreate", "beforeUpdate"],
  beforeCreate: ["beforeCreate"],
  beforeUpdate: ["beforeUpdate"],
  beforeDelete: ["beforeDelete"],
  afterSave: ["afterCreate",  "afterUpdate"],
  afterCreate: ["afterCreate"],
  afterUpdate: ["afterUpdate"],
  afterDelete: ["afterDelete"],
};

/**
 * Process-wide hook dispatcher for the single-core model.
 *
 * The KnexORM event bus is STATIC (one EventEmitter per process). Previously
 * every Loopar instance owned its own HookManager and called attach() in init,
 * so N tenant instances stacked N listener sets on the shared bus — every ORM
 * event was dispatched N times, and each tenant's hooks fired for OTHER tenants'
 * events (cross-tenant fan-out). On top of that, attach() iterated
 * `Object.values(EVENT_MAP).flat()`, which repeats ormEvents (e.g. "beforeCreate"
 * appears in beforeSave AND beforeCreate), registering duplicate listeners even
 * within one instance.
 *
 * This is now a single shared instance (see `hookManager` export). It:
 *   - attaches to the bus exactly ONCE (deduped event set),
 *   - stores hooks namespaced per tenant (`loopar.requestTenantId`, resolved via
 *     the request ALS — the same context the ORM event fires in),
 *   - dispatches only the CURRENT tenant's hooks for each event.
 *
 * Tenant resolution uses `getTenant()` from request-context directly (not the
 * `loopar` proxy) to avoid an import cycle with loopar.js.
 */
class HookManager {
  // tenant -> { ormEvent -> [{ document, callback }] }
  #hooksByTenant = new Map();
  #attached = false;

  /** Tenant namespace for the current async context (core outside a request). */
  #tenant() {
    return getTenant()?.name ?? '__core__';
  }

  #bucket(tenant, create = false) {
    let byEvent = this.#hooksByTenant.get(tenant);
    if (!byEvent && create) {
      byEvent = {};
      this.#hooksByTenant.set(tenant, byEvent);
    }
    return byEvent;
  }

  /**
   * Wire the static ORM bus ONCE. Subsequent instances calling attach() are
   * no-ops. The event set is deduped so each ormEvent gets a single listener.
   */
  attach(orm) {
    if (this.#attached) return;
    this.#attached = true;

    const ormEvents = new Set(Object.values(EVENT_MAP).flat());
    for (const ormEvent of ormEvents) {
      orm.on(ormEvent, (payload) => {
        this.#dispatch(ormEvent, payload);
      });
    }
  }

  register(document, event, callback) {
    const ormEvents = EVENT_MAP[event];

    if (!ormEvents) {
      console.warn(`[HookManager] Unknown event "${event}". Valid: ${Object.keys(EVENT_MAP).join(", ")}`);
      return;
    }

    const byEvent = this.#bucket(this.#tenant(), true);
    for (const ormEvent of ormEvents) {
      (byEvent[ormEvent] ??= []).push({ document, callback });
    }
  }

  /** Remove hooks for a document within the CURRENT tenant (or all of them). */
  unregister(document) {
    const byEvent = this.#bucket(this.#tenant());
    if (!byEvent) return;

    if (!document) {
      this.#hooksByTenant.delete(this.#tenant());
      return;
    }

    for (const ormEvent of Object.keys(byEvent)) {
      byEvent[ormEvent] = byEvent[ormEvent].filter(h => h.document !== document);
    }
  }

  /**
   * Drop every hook registered for a tenant. Called when a tenant instance is
   * evicted so a later re-init re-registers cleanly instead of stacking.
   */
  unregisterTenant(tenant) {
    if (tenant) this.#hooksByTenant.delete(tenant);
  }

  async #dispatch(ormEvent, payload) {
    const byEvent = this.#bucket(this.#tenant());
    const handlers = byEvent?.[ormEvent] ?? [];

    for (const { document, callback } of handlers) {
      if (payload.document !== document) continue;

      try {
        await callback(payload.data ?? payload);
      } catch (err) {
        console.error(`[HookManager] Error in hook "${ormEvent}" for "${document}":`, err.message);
      }
    }
  }
}

/**
 * THE shared hook dispatcher. Every Loopar instance points its `hookManager`
 * at this one object; namespacing keeps tenants isolated.
 */
export const hookManager = new HookManager();

// Back-compat: some call sites imported the class. Keep the name exported.
export { HookManager };
