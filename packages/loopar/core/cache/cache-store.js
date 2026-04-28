export class MemoryStore {
  #store = new Map();

  async hget(hash, field) {
    return this.#store.get(`${hash}:${field}`) ?? null;
  }

  async hset(hash, field, value) {
    this.#store.set(`${hash}:${field}`, value);
  }

  async hdel(hash, field) {
    if (field) {
      this.#store.delete(`${hash}:${field}`);
    } else {
      for (const key of this.#store.keys()) {
        if (key.startsWith(`${hash}:`)) this.#store.delete(key);
      }
    }
  }

  async expire() {}
  async quit() {}
}