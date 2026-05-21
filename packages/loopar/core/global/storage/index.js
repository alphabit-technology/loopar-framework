'use strict';

import { StorageDriver } from './storage-driver.js';
import { LocalDriver } from './local-driver.js';
import { CloudinaryDriver } from './cloudinary-driver.js';

/**
 * StorageManager — central registry of asset persistence drivers.
 *
 * Exposed on the loopar singleton as `loopar.storage`. Concepts:
 *
 *   - `active`: the driver new uploads route through.
 *   - `for(name)`: a specific driver by name — used at READ time, since
 *     every `File Manager` row records the driver that created it in its
 *     `storage_driver` column and must always be served through that
 *     same driver, even after the active driver changes.
 *   - `register` / `setActive`: how a provider gets wired in.
 *
 * Driver activation flow (see `Loopar.#bootstrapStorage`):
 *   1. `System Settings.active_storage` names a storage Single
 *      (e.g. "Cloudinary").
 *   2. That Single's `buildDriver()` returns a driver instance.
 *   3. `register(driver)` + `setActive(driver.name)`.
 *
 * `local` and `reference` are registered up-front: `local` is the
 * fallback when nothing else is active, `reference` is selected
 * per-operation by URL imports.
 *
 * Failure contract: a misconfigured active driver falls back to "local"
 * rather than throwing on every call.
 */
export class StorageManager {
  #drivers = new Map();
  #activeDriverName = 'local';

  constructor() {
    // LocalDriver is always available as the default / fallback.
    // Other drivers (Cloudinary, …) register themselves when a
    // storage Single is activated at bootstrap.
    this.register(new LocalDriver());
  }

  /**
   * Register a driver. Must extend `StorageDriver`. Driver name is the
   * key consumers use in `File Manager.storage_driver`.
   */
  register(driver) {
    if (!(driver instanceof StorageDriver)) {
      throw new Error('StorageManager.register: driver must extend StorageDriver');
    }
    this.#drivers.set(driver.name, driver);
  }

  /** Driver names currently registered. */
  get registered() {
    return Array.from(this.#drivers.keys());
  }

  /** The driver new uploads should go through. Falls back to local. */
  get active() {
    return this.#drivers.get(this.#activeDriverName) || this.#drivers.get('local');
  }

  /**
   * Look up a driver by name. Returns the local driver as a last-resort
   * fallback if the requested driver isn't registered — this is what
   * lets the system keep serving a legacy asset whose driver is no
   * longer configured (it will resolve to local, fail gracefully when
   * the file isn't there, and the user gets a broken image rather than
   * a 500).
   */
  for(name) {
    return this.#drivers.get(name || 'local') || this.#drivers.get('local');
  }

  /**
   * Choose the active driver. If `name` is not registered, keep the
   * current active and log a warning — never throw, never silently swap.
   */
  setActive(name) {
    if (!name) {
      this.#activeDriverName = 'local';
      return;
    }
    if (this.#drivers.has(name)) {
      this.#activeDriverName = name;
    } else {
      console.warn(`[storage] driver "${name}" is not registered; keeping "${this.#activeDriverName}".`);
    }
  }

  /**
   * Register a driver instance (returned by a storage Single's
   * `buildDriver()`) and make it the active one in a single step.
   * Called by `Loopar.#bootstrapStorage`.
   */
  activateDriver(driver) {
    if (!driver) {
      this.setActive('local');
      return;
    }

    this.register(driver);
    this.setActive(driver.name);
  }
}

export { StorageDriver, LocalDriver, CloudinaryDriver };
export default StorageManager;
