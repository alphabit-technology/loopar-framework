'use strict';

/**
 * StorageDriver — abstract contract for asset persistence.
 *
 * Implementations: LocalDriver (filesystem), CloudinaryDriver (HTTP API),
 * future S3Driver / R2Driver / etc.
 *
 * The contract is intentionally provider-agnostic: callers pass logical
 * metadata (app, visibility) and let each driver translate it into its own
 * physical location (a filesystem path, a Cloudinary folder, an S3 prefix,
 * a R2 object key...). This way the rest of the codebase never has to know
 * which driver is active.
 *
 * Coexistence rule: every `File Manager` row records which driver created
 * it (`storage_driver` column). Reads always go through the **owning**
 * driver, never the currently-active one — that's what makes it safe to
 * switch drivers without breaking legacy assets.
 */
export class StorageDriver {
  /**
   * Stable identifier for this driver. Must match the value persisted in
   * `File Manager.storage_driver`. Examples: "local", "cloudinary", "s3".
   * @returns {string}
   */
  get name() {
    throw new Error(`${this.constructor.name} must implement 'name' getter`);
  }

  /**
   * Persist a binary buffer.
   *
   * @param {Object} params
   * @param {Buffer} params.buffer - the file contents
   * @param {string} params.originalName - filename as supplied by the user
   * @param {?string} params.app - app context (null = tenant-shared)
   * @param {string} params.visibility - "public" | "private"
   * @param {?string} params.contentType - mime type, when known
   *
   * @returns {Promise<{
   *   externalId: ?string, // provider-side id (Cloudinary public_id, S3 key…). null for LocalDriver.
   *   src: string, // public URL or in-app path (`/assets/...`)
   *   bytes: number,
   *   format: ?string, // canonical extension/format reported by provider
   *   width: ?number,
   *   height: ?number,
   *   storedName: string // final filename used (may differ from originalName after collision-rename)
   * }>}
   */
  async upload(_params) {
    throw new Error(`${this.constructor.name} must implement 'upload(params)'`);
  }

  /**
   * Import a remote URL into this driver's storage. Used by the "Web"
   * origin in the file picker: instead of saving the raw URL as a dangling
   * reference, we materialize it into a real asset record.
   *
   * @param {Object} params
   * @param {string} params.url
   * @param {?string} params.app
   * @param {string} params.visibility
   *
   * @returns {Promise<{externalId, src, bytes, format, width, height, storedName, originalName}>}
   */
  async importFromUrl(_params) {
    throw new Error(`${this.constructor.name} must implement 'importFromUrl(params)'`);
  }

  /**
   * Delete the underlying asset. Receives both `externalId` (provider id)
   * and the asset record metadata (`{ storedName, app, visibility }`) so
   * filesystem drivers — which have no externalId — can locate the file.
   *
   * Implementations should be idempotent: a missing asset is not an error.
   *
   * @param {Object} params
   * @param {?string} params.externalId
   * @param {string} params.storedName
   * @param {?string} params.app
   * @param {string} params.visibility
   */
  async delete(_params) {
    throw new Error(`${this.constructor.name} must implement 'delete(params)'`);
  }

  /**
   * Resolve the delivery URL for an asset, optionally applying a
   * provider-neutral transform. The transform contract is small on
   * purpose; any field a given driver cannot honor is ignored silently.
   *
   * @param {Object} params
   * @param {?string} params.externalId
   * @param {string} params.src        - the persisted `src` from `file_ref`
   * @param {?Object} params.transform  - { width, height, fit, format, quality }
   *   fit:     "cover" | "contain" | "fill"
   *   format:  "auto" | "webp" | ...
   *   quality: "auto" | number
   * @param {boolean} [params.signed]   - request a signed/time-limited URL (private assets)
   *
   * @returns {string}
   */
  deliveryUrl(_params) {
    throw new Error(`${this.constructor.name} must implement 'deliveryUrl(params)'`);
  }
}

export default StorageDriver;
