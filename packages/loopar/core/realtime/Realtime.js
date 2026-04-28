'use strict';
import { SequelizeORM } from "SequelizeORM";

const HOOK_MAP = {
  beforeCreate: ["beforeCreate"],
  afterCreate:  ["afterCreate"],

  beforeUpdate: ["beforeUpdate"],
  afterUpdate:  ["afterUpdate"],

  beforeDelete: ["before_delete"],
  afterDelete:  ["after_delete"],

  beforeSave:   ["beforeCreate", "beforeUpdate"],
  afterSave:    ["afterCreate",  "afterUpdate"],

  afterGet:     ["afterGet"],
};


function normalize(hook, model, payload) {
  return {
    model,
    hook,
    name: payload.name ?? payload.data?.name ?? null,
    data: payload.data ?? null,
    result: payload.result ?? null,
  };
}

export class Realtime {
  #registry = new Map();

  on(model, hook, handler) {
    const ormEvents = HOOK_MAP[hook];
    if (!ormEvents) {
      throw new Error(
        `[Realtime] Unknown hook "${hook}". Available: ${Object.keys(HOOK_MAP).join(", ")}`
      );
    }

    const key      = this.#key(model, hook, handler);
    const entries  = [];

    for (const ormEvent of ormEvents) {
      const qualifiedEvent = `${ormEvent}:${model}`;
      const wrapper        = (payload) => handler(normalize(hook, model, payload));

      SequelizeORM.on(qualifiedEvent, wrapper);
      entries.push({ ormEvent: qualifiedEvent, wrapper });
    }

    this.#registry.set(key, entries);
    return this;
  }

  off(model, hook, handler) {
    const key     = this.#key(model, hook, handler);
    const entries = this.#registry.get(key);

    if (entries) {
      for (const { ormEvent, wrapper } of entries) {
        SequelizeORM.off(ormEvent, wrapper);
      }
      this.#registry.delete(key);
    }

    return this;
  }

  once(model, hook, handler) {
    const onceWrapper = (payload) => {
      handler(payload);
      this.off(model, hook, onceWrapper);
    };
    return this.on(model, hook, onceWrapper);
  }

  clear(model = null) {
    for (const [key, entries] of this.#registry.entries()) {
      if (model && !key.startsWith(`${model}::`)) continue;

      for (const { ormEvent, wrapper } of entries) {
        SequelizeORM.off(ormEvent, wrapper);
      }
      this.#registry.delete(key);
    }
    return this;
  }

  list(model = null) {
    const result = [];
    for (const key of this.#registry.keys()) {
      const [m, h] = key.split("::");
      if (model && m !== model) continue;
      result.push({ model: m, hook: h, ormEvents: HOOK_MAP[h] });
    }
    return result;
  }

  #key(model, hook, handler) {
    return `${model}::${hook}::${handler}`;
  }
}

export const HOOKS = /** @type {const} */ (Object.keys(HOOK_MAP));