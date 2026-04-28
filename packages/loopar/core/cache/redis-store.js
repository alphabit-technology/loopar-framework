import Redis from "ioredis";

export class RedisStore {
  #client;
  #ttl;

  constructor({ host = "127.0.0.1", port = 6379, password, ttl = 3600 } = {}) {
    this.#ttl = ttl;
    this.#client = new Redis({
      host, port, password,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 5000),
      enableOfflineQueue: false,
    });

    this.#client.on("error", (err) => {
      console.warn("[Redis] Connection error:", err.message);
    });
  }

  async connect() {
    await this.#client.connect();
  }

  async hget(hash, field) {
    try {
      return await this.#client.hget(hash, field);
    } catch {
      return null;
    }
  }

  async hset(hash, field, value) {
    try {
      await this.#client.hset(hash, field, value);
    } catch {
    }
  }

  async hdel(hash, field) {
    try {
      await this.#client.hdel(hash, field);
    } catch {
    }
  }

  async expire(hash, ttl) {
    await this.#client.expire(hash, ttl);
  }

  async quit() {
    await this.#client.quit();
  }
}