'use strict';

/**
 * TenantRegistry — read-only, cached view of the physical tenant catalog
 * (`sites/<name>/.env`) with Host → tenant resolution.
 */

import { tenant as tenantStore } from '../../bin/tenant/tenant-builder.js';

const TTL_MS = 5_000;

class TenantRegistry {
  #byHost = new Map();
  #byName = new Map();
  #builtAt = 0;

  #isStale() {
    return this.#builtAt === 0 || (Date.now() - this.#builtAt) > TTL_MS;
  }

  #rebuild() {
    const byHost = new Map();
    const byName = new Map();

    for (const t of tenantStore.tenants()) {
      // t is normalized by tenant-builder: { name, domain, status, online }.
      const name = t.name;
      const domain = String(t.domain || `${name}.localhost`).toLowerCase();
      const entry = {
        name,
        domain,
        status: t.status,
        suspended: t.status === 'suspended',
      };

      byName.set(name.toLowerCase(), entry);
      byHost.set(domain, entry);
      byHost.set(`${name.toLowerCase()}.localhost`, entry);
    }

    this.#byHost = byHost;
    this.#byName = byName;
    this.#builtAt = Date.now();
  }

  all() {
    if (this.#isStale()) this.#rebuild();
    return [...this.#byName.values()];
  }

  get(name) {
    if (!name) return null;
    if (this.#isStale()) this.#rebuild();
    return this.#byName.get(String(name).toLowerCase()) || null;
  }

  /**
   * Resolve an HTTP Host header to a tenant entry, or null.
   * Strips the port and lowercases — `site.localhost:3102` and
   * `site.example.com` both resolve.
   */
  resolveHost(host) {
    if (!host) return null;
    if (this.#isStale()) this.#rebuild();
    const bare = String(host).toLowerCase().split(':')[0];
    return this.#byHost.get(bare) || null;
  }

  /** Force a rebuild on next access (call after mutating sites/). */
  invalidate() {
    this.#builtAt = 0;
  }
}

export const tenantRegistry = new TenantRegistry();
