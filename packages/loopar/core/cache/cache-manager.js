import { RedisStore } from "./redis-store.js";
import { MemoryStore } from "./cache-store.js";
import { redisConfig } from "../config/core-config.js";

class CacheManager {
  #store = null;
  #looparRef = null;
  #fallbackSite = null;

  async initialize(loopar) {
    // The store is process-wide and its keys are already namespaced per
    // tenant (see #key), so build it ONCE. In shared-process mode every
    // tenant instance calls initialize(); the first builds the store, the
    // rest just refresh the boot-time fallback site.
    this.#looparRef ??= loopar;
    this.#fallbackSite = loopar.tenantId;

    if (this.#store) return;

    const cfg = redisConfig();

    if (cfg.host) {
      try {
        const store = new RedisStore({
          host: cfg.host,
          port: cfg.port,
          password: cfg.password || null,
          ttl: cfg.ttlPermissions,
        });
        await store.connect();
        this.#store = store;
        console.info(`[Cache] Redis connected (shared store, per-tenant keys)`);
      } catch (err) {
        console.warn(`[Cache] Redis not available, using MemoryStore: ${err.message}`);
        this.#store = new MemoryStore();
      }
    } else {
      this.#store = new MemoryStore();
      console.info(`[Cache] No Redis config, using MemoryStore (in-process, per-tenant keys)`);
      // CLUSTER SAFETY: MemoryStore lives in ONE worker's heap. Under PM2
      // cluster (NODE_APP_INSTANCE set) each worker gets its own copy, so an
      // invalidation in one worker is invisible to the others. Redis is
      // required for a coherent cache across workers.
      if (process.env.NODE_APP_INSTANCE !== undefined) {
        console.warn('[Cache] \u26a0\ufe0f  Cluster WITHOUT Redis \u2014 cache is per-worker and NOT coherent. Set redis in config/core.json.');
      }
    }
  }

  /**
   * The tenant namespace for cache keys. Resolved from the CURRENT REQUEST
   * (loopar.requestTenantId) so a shared store never leaks one tenant's
   * permissions/sessions to another. Falls back to the boot-time site when
   * called outside a request (jobs, startup).
   */
  #site() {
    return this.#looparRef?.requestTenantId ?? this.#fallbackSite;
  }

  #key(type) {
    return `${this.#site()}:${type}`;
  }

  async getPermissions(username) {
    const raw = await this.#store.hget(this.#key("permissions"), username);
    return raw ? new Set(JSON.parse(raw)) : null;
  }

  async setPermissions(username, permSet) {
    await this.#store.hset(
      this.#key("permissions"),
      username,
      JSON.stringify([...permSet])
    );
  }

  async invalidatePermissions(username) {
    if (username) {
      await this.#store.hdel(this.#key("permissions"), username);
    } else {
      await this.#store.hdel(this.#key("permissions"), null);
    }
  }

  async getSession(sessionId) {
    const raw = await this.#store.hget(this.#key("sessions"), sessionId);
    return raw ? JSON.parse(raw) : null;
  }

  async setSession(sessionId, data, ttl) {
    await this.#store.hset(
      this.#key("sessions"),
      sessionId,
      JSON.stringify(data)
    );
    if (ttl) await this.#store.expire(this.#key("sessions"), ttl);
  }

  async deleteSession(sessionId) {
    await this.#store.hdel(this.#key("sessions"), sessionId);
  }
}

export const cacheManager = new CacheManager();