import { RedisStore } from "./redis-store.js";
import { MemoryStore } from "./cache-store.js";

class CacheManager {
  #store = null;
  #site = null;

  async initialize(loopar) {
    this.#site = loopar.tenantId;

    const host = process.env.REDIS_HOST;
  
    console.log(["Cache Config", host])
    if (host) {
      try {
        const store = new RedisStore({
          host,
          port: parseInt(process.env.REDIS_PORT ?? "6379"),
          password: process.env.REDIS_PASSWORD || null,
          ttl: parseInt(process.env.REDIS_TTL_PERMISSIONS ?? "300"),
        });
        await store.connect();
        this.#store = store;
        console.info(`[Cache] Redis conectado → ${this.#site}`);
      } catch (err) {
        console.warn(`[Cache] Redis no disponible, usando MemoryStore: ${err.message}`);
        this.#store = new MemoryStore();
      }
    } else {
      this.#store = new MemoryStore();
      console.info(`[Cache] Sin config Redis → MemoryStore para ${this.#site}`);
    }
  }

  #key(type) {
    return `${this.#site}:${type}`;
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