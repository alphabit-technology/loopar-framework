'use strict';

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

export class HookManager {
  #hooks = {};
  #attached = false;

  attach(orm) {
    if (this.#attached) return;

    for (const ormEvent of Object.values(EVENT_MAP).flat()) {
      orm.on(ormEvent, (payload) => {
        this.#dispatch(ormEvent, payload);
      });
    }

    this.#attached = true;
  }

  register(document, event, callback) {
    const ormEvents = EVENT_MAP[event];

    if (!ormEvents) {
      console.warn(`[HookManager] Unknown event "${event}". Valid: ${Object.keys(EVENT_MAP).join(", ")}`);
      return;
    }

    for (const ormEvent of ormEvents) {
      if (!this.#hooks[ormEvent]) this.#hooks[ormEvent] = [];
      this.#hooks[ormEvent].push({ document, callback });
    }
  }

  unregister(document) {
    if (!document) {
      this.#hooks = {};
      return;
    }

    for (const ormEvent of Object.keys(this.#hooks)) {
      this.#hooks[ormEvent] = this.#hooks[ormEvent].filter(
        h => h.document !== document
      );
    }
  }

  async #dispatch(ormEvent, payload) {
    const handlers = this.#hooks[ormEvent] ?? [];

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