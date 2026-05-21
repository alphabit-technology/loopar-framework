
'use strict';

import { BaseDocument, loopar } from 'loopar';
import mime from "mime-types";
import fs from "fs";
import path from 'pathe';

export default class FileManager extends BaseDocument {
  #reqUploadFile = null;
  #remoteImport = null;
  #route = null;
  constructor(props) {
    super(props);
  }

  get reqUploadFile() {
    return this.#reqUploadFile;
  }

  get remoteImport() {
    return this.#remoteImport;
  }

  /**
   * Companion to `reqUploadFile` for the "Web" origin of the file
   * picker. Instead of a multer-parsed buffer we receive a URL plus:
   *
   *   - `name`: the filename the client already staged in the doc
   *     (designer field / file input). Using it verbatim guarantees
   *     `File Manager.name` matches the doc reference so the
   *     post-save patcher can rewrite it.
   *   - `mode`: "reference" (record the URL as-is, no download — the
   *     asset stays a pointer to the external URL) or "download"
   *     (fetch the bytes through the active driver).
   *
   * Falls back to a URL-derived name when the client didn't pass one.
   */
  set remoteImport({ url, name, mode } = {}) {
    if (!url) {
      this.#remoteImport = null;
      return;
    }

    let derivedName = name;
    if (!derivedName) {
      try {
        const u = new URL(url);
        const last = u.pathname.split('/').filter(Boolean).pop();
        derivedName = last ? decodeURIComponent(last) : `import_${Date.now()}`;
      } catch {
        derivedName = `import_${Date.now()}`;
      }
    }
    derivedName = this.normalizeFileName(derivedName);

    this.route = derivedName;
    if (this.__IS_NEW__) {
      this.name = derivedName;
      this.created_at = new Date();
    }
    this.extention = (derivedName.split('.').pop() || '').toLowerCase();

    this.#remoteImport = { url, derivedName, mode: mode || 'reference' };
  }

  normalizeFileName(name = '') {
    if (typeof name !== 'string') return '';

    let normalized = name;

    // If the name still contains mojibake bytes, try latin1 -> utf8 decode once.
    if (/[\u0080-\u009f]/.test(normalized)) {
      normalized = Buffer.from(normalized, 'latin1').toString('utf8');
    }

    return normalized
      .normalize('NFKC')
      .replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  set reqUploadFile(file) {
    if (file?.originalname) {
      // Multer can provide latin1-encoded names for utf-8 filenames.
      file.originalname = this.normalizeFileName(Buffer.from(file.originalname, 'latin1').toString('utf8'));
    }

    this.size = file.size;
    this.type = this.getFileType(file);
    this.extention = file.originalname.split('.').pop();
    this.route = file.originalname || '';

    if (this.__IS_NEW__) {
      this.name = file.originalname;
      this.created_at = new Date();
    }

    this.#reqUploadFile = file;
  }

  getFileType(file) {
    file ??= this.reqUploadFile;
    if(!file) return 'file';

    const ext = (file.originalname || file.name).split('.').pop().toLowerCase();
    const mimeType = mime?.lookup(ext)?.split('/')?.shift();
    return mimeType ?? 'file';
  }

  get pathBase() {
    if (this.app && this.app.length > 0) {
      return loopar.makePath(loopar.pathRoot, 'apps', this.app, 'uploads', this.visible || "public");
    } else {
      return loopar.makePath(loopar.tenantPath, 'uploads', this.visible || "public");
    }
  }

  getStatFile() {
    const pathBase = this.pathBase;
    const filePath = path.join(pathBase, this.name);
    try {
      return fs.statSync(filePath);
    } catch (e) {
      return null;
    }
  }

  getFile() {
    const pathBase = this.pathBase;
    const filePath = path.join(pathBase, this.name);
    try {
      return fs.readFileSync(filePath);
    } catch (e) {
      return null;
    }
  }

  metaFile() {
    return loopar.utils.isJSON(this.file_ref) ? JSON.parse(this.file_ref)[0] : {};
  }

  get thumbnailPath() {
    return loopar.makePath(this.pathBase, "thumbnails");
  }

  get filePath() {
    return loopar.makePath(this.pathBase, this.name);
  }

  get route() {
    return this.#route ?? this.metaFile().src ?? '';
  }

  set route(route) {
    this.#route = route;
  }

  get isLocal() {
    return typeof this.route === 'string' && this.route.startsWith('/');
  }

  get isRemote() {
    return !this.isLocal;
  }

  async save() {
    const file = this.reqUploadFile;
    const remote = this.#remoteImport;

    // Filesystem-only entity: with neither a binary nor a remote
    // import there is nothing to persist — the mirror IS the asset's
    // metadata and only a save that produces bytes (or a reference)
    // touches disk.
    if (!file && !remote) {
      return this;
    }

    // ---- Resolve the working name ----
    //   - Local upload: normalize multer's originalname (latin1 mojibake).
    //   - Remote import: use the URL-derived name set by the setter.
    let uploadName;
    if (file) {
      uploadName = this.normalizeFileName(
        Buffer.from(file.originalname || file.name || '', 'latin1').toString('utf8')
      );
      if (!uploadName) uploadName = this.name;
      this.#reqUploadFile.originalname = uploadName;
    } else {
      uploadName = remote.derivedName || this.name;
    }

    // ---- Collision check (filesystem mirror) ----
    //
    // The contract: "same name + same app = reuse the existing
    // asset". A stable `File Manager.name` per filename is what lets
    // the page-builder reference assets by name alone (e.g.
    // `background_image: [{ name }]`) and the asset middleware
    // resolve `/assets/public/{name}` back to the owning driver.
    //
    // `getAssetPath` is already app-scoped, so a mirror at
    // `{assetPath}/{uploadName}.meta.json` is INHERENTLY per-app —
    // there is no cross-app collision to disambiguate. When the
    // mirror exists we EARLY-RETURN before any driver call,
    // rehydrating this entity from the mirror so the caller
    // (`_processFile` / `_processRemoteFile` in core-document) gets
    // back a populated `file_ref` and the post-save patcher can
    // rewrite the doc reference. Re-uploads under the same name are a
    // no-op at this layer — a deliberate trade-off to avoid orphan
    // remote objects; content-based replacement is a future task.
    const existing = this.#readMirror(uploadName);
    if (existing) {
      this.name = uploadName;
      this.__DOCUMENT_NAME__ = uploadName;
      this.size = existing.size;
      this.type = existing.type;
      this.extention = existing.extention || (uploadName.split('.').pop() || '').toLowerCase();
      this.storage_driver = existing.storage_driver;
      this.external_id = existing.external_id;
      this.external_url = existing.external_url;
      this.file_ref = JSON.stringify([{
        name: uploadName,
        type: existing.type,
        size: existing.size,
        src: existing.src,
        previewSrc: existing.previewSrc,
      }]);
      this.route = uploadName;
      return this;
    }

    // ---- Persist the asset ----
    // Three paths, all producing the same result shape:
    //
    //   - binary upload   → active driver `.upload(buffer)`
    //   - download import → active driver `.importFromUrl(url)`
    //   - reference import → NO driver. `reference` is an import
    //     *mode*, not a storage backend: the asset is just a pointer
    //     to an external URL, nobody stored bytes. We record the URL
    //     as-is and tag `storage_driver = "reference"` as a marker.
    const isReference = !!remote && remote.mode === 'reference';

    let result;
    let driverName;
    if (isReference) {
      driverName = 'reference';
      result = {
        externalId: remote.url,
        src: remote.url,
        bytes: null,
        storedName: uploadName,
      };
    } else {
      const driver = loopar.storage.active;
      driverName = driver.name;
      result = file
        ? await driver.upload({
            buffer: file.buffer,
            originalName: uploadName,
            app: this.app,
            visibility: this.visible || 'public',
            contentType: file.mimetype || mime?.lookup(uploadName) || null,
          })
        : await driver.importFromUrl({
            url: remote.url,
            app: this.app,
            visibility: this.visible || 'public',
          });
    }

    // The LocalDriver may rename on disk-content collision (a second
    // file with the same name but different bytes). For Cloudinary /
    // reference `storedName === uploadName`.
    if (result.storedName !== uploadName) {
      uploadName = result.storedName;
      this.name = uploadName;
      this.__DOCUMENT_NAME__ = uploadName;
    }

    // ---- Record metadata on the document ----
    this.size = result.bytes;
    this.extention = (uploadName.split('.').pop() || '').toLowerCase();
    this.type = this.getFileType({ originalname: uploadName });
    this.storage_driver = driverName;
    this.external_id = result.externalId || null;
    // For local assets file_ref.src already carries the URL; external_url
    // holds the absolute URL for assets that live outside our /assets
    // (Cloudinary, or a referenced external URL).
    this.external_url = (driverName === 'local') ? null : result.src;
    // previewSrc: for a stored asset the active driver computes it
    // (LocalDriver → thumbnails/ path, Cloudinary → transformed URL).
    // A referenced external URL can't be transformed, so the preview
    // is the URL itself.
    const previewSrc = isReference
      ? result.src
      : loopar.storage.active.deliveryUrl({
          src: result.src,
          externalId: result.externalId,
          transform: {
            width: 200,
            height: 200,
            fit: 'cover',
            format: 'auto',
            quality: 'auto',
          },
        });

    this.file_ref = JSON.stringify([{
      name: uploadName,
      type: this.type,
      size: result.bytes,
      src: result.src,
      previewSrc,
    }]);
    this.route = uploadName;

    // No DB write — the mirror sidecar is the asset's record of
    // truth and the read path resolves entirely from it.
    await this.#writeMirror({ src: result.src, previewSrc, bytes: result.bytes });
    return this;
  }

  /**
   * Write the asset's mirror file next to where its binary would (or
   * does) live. The mirror is the source of truth for the read path:
   * the asset middleware consults `{name}.meta.json` to resolve URLs
   * for assets whose binary lives in a remote driver, without
   * touching the DB.
   *
   * Atomic-ish: writes to `{name}.meta.json.tmp` first and renames,
   * so a partial read can never observe a half-written JSON.
   */
  async #writeMirror({ src, previewSrc, bytes }) {
    if (!this.name) return;

    const dir = loopar.getAssetPath({
      app: this.app,
      visibility: this.visible || 'public',
    });
    await fs.promises.mkdir(dir, { recursive: true });

    const mirrorPath = path.join(dir, `${this.name}.meta.json`);
    const data = {
      version: 1,
      name: this.name,
      type: this.type || null,
      extention: this.extention || null,
      size: bytes ?? this.size ?? null,
      storage_driver: this.storage_driver || 'local',
      external_id: this.external_id || null,
      external_url: this.external_url || null,
      src,
      previewSrc,
      app: this.app || null,
      visibility: this.visible || 'public',
      updated_at: new Date().toISOString(),
    };

    const tmpPath = `${mirrorPath}.tmp`;
    await fs.promises.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    await fs.promises.rename(tmpPath, mirrorPath);
  }

  async #deleteMirror() {
    if (!this.name) return;
    const dir = loopar.getAssetPath({
      app: this.app,
      visibility: this.visible || 'public',
    });
    const mirrorPath = path.join(dir, `${this.name}.meta.json`);
    try {
      await fs.promises.unlink(mirrorPath);
    } catch (err) {
      if (err?.code !== 'ENOENT') {
        console.warn('[File Manager] mirror unlink failed:', err?.message || err);
      }
    }
  }

  async delete() {
    // Filesystem-only: there is no DB row to remove. When the entity
    // wasn't hydrated (the controller just sets `name`/`app`),
    // resolve the owning driver from the mirror before deleting.
    if (!this.storage_driver) {
      const mirror = this.#readMirror();
      if (mirror) {
        this.storage_driver = mirror.storage_driver;
        this.external_id = mirror.external_id;
      }
    }

    // Delegate physical deletion to the driver that owns this asset.
    // A `reference` asset has no bytes of ours to delete — it's just
    // a pointer to an external URL — so we skip the driver call.
    // Anything else (including a bare local binary with no mirror)
    // goes through its driver; `local` is the safe default.
    const driverName = this.storage_driver || 'local';
    if (driverName !== 'reference') {
      const driver = loopar.storage.for(driverName);
      await driver.delete({
        externalId: this.external_id,
        storedName: this.name,
        app: this.app,
        visibility: this.visible || 'public',
      });
    }

    // Drop the mirror so the read path stops resolving this asset.
    await this.#deleteMirror();
  }

  async loadDiskFiles(rows = []) {
    // Enumerate INSTALLED apps only — `loopar.installedApps` reads
    // the `installed-apps` config file (no DB), and it is the very
    // same source `getAssetRoots()` uses to mount `express.static`.
    // Using it here keeps the listing in sync with what the server
    // can actually serve: an app that's present in `apps/` on disk
    // but not installed for this tenant has its assets unexposed, so
    // listing its mirrors would surface references that 404.
    const apps = Object.keys(loopar.installedApps || {});

    const loadFiles = (source = "uploads", app) => {
      // Accept both relative (`apps/myapp/uploads`) and absolute
      // (`{tenantPath}/uploads`) sources. The legacy code joined
      // `loopar.pathRoot + source` unconditionally; when the caller
      // already passed an absolute path, the join produced a
      // duplicated nonsense path (e.g. `/Users/.../loopar/Users/.../sites/dev/uploads`)
      // that never matched the filesystem — so the entire site
      // tenant subtree was silently invisible in the listing.
      const sourcePath = path.isAbsolute(source)
        ? source
        : path.join(loopar.pathRoot, source);

      if (fs.existsSync(sourcePath)) {
        const filesPath = path.join(sourcePath, this.visible || "public");
        if (fs.existsSync(filesPath)) {
          const diskFiles = fs.readdirSync(filesPath);

          // First pass: collect every binary filename in this dir,
          // so we can decide later whether a mirror's companion
          // binary is also present.
          const binarySet = new Set(diskFiles.filter(f => !f.endsWith('.meta.json')));

          diskFiles.forEach(file => {
            const fullPath = path.join(filesPath, file);

            // Mirror sidecars: list only when the binary is missing —
            // that's the "remote driver" case (Cloudinary, Reference)
            // where the mirror IS the asset's only on-disk
            // representation. When a binary exists adjacent to the
            // mirror, the binary handles itself in the branch below
            // (avoid double-listing).
            if (file.endsWith('.meta.json')) {
              const baseName = file.slice(0, -'.meta.json'.length);
              if (binarySet.has(baseName)) return;
              if (rows.findIndex(r => r.name === baseName) !== -1) return;

              try {
                const raw = fs.readFileSync(fullPath, 'utf8');
                const meta = JSON.parse(raw);
                rows.push({
                  name: baseName,
                  created_at: meta.updated_at ? new Date(meta.updated_at) : null,
                  extention: meta.extention || baseName.split('.').pop(),
                  size: meta.size,
                  type: meta.type,
                  app: app,
                  storage_driver: meta.storage_driver,
                  external_id: meta.external_id,
                  external_url: meta.external_url,
                  // src/previewSrc travel along so getMappedFiles can
                  // render the right preview without an extra round-trip.
                  src: meta.src,
                  previewSrc: meta.previewSrc,
                });
              } catch {}
              return;
            }

            const stat = fs.statSync(fullPath);
            if (stat.isDirectory()) return;
            if (rows.findIndex(r => r.name === file) !== -1) return;

            rows.push({
              name: file,
              created_at: stat.birthtime,
              extention: file.split('.').pop(),
              size: stat.size,
              app: app
            });
          });
        }
      }
    }

    if (this.app) {
      loadFiles(`apps/${this.app}/uploads`, this.app);
    } else {
      for (const app of apps) {
        loadFiles(`apps/${app}/uploads`, app);
      }

      loadFiles("uploads");
      loadFiles(path.join(loopar.tenantPath, "uploads"));
    }

    return rows;
  }

  loadFile(file) {
    // 1. Local binary path — historical behavior for LocalDriver
    //    assets where the file lives on this filesystem.
    file ??= this.getStatFile();

    if (file) {
      this.file_ref = JSON.stringify([{
        name: this.name,
        type: this.getFileType({name: this.name, ...file}),
        size: this.size,
        src: `/assets/${this.visible || "public"}/${this.name}`
      }]);

      this.size = file.size;
      this.created_at = file.birthtime;
      this.extention = this.name.split('.').pop();
      this.type = this.getFileType({name: this.name, ...file});
      this.name = this.name;

      return true;
    }

    // 2. No binary — try the mirror sidecar. Remote-driver assets
    //    (Cloudinary, Reference) leave only `{name}.meta.json` on
    //    disk; without this fallback the View/Update actions can't
    //    open them.
    const mirror = this.#readMirror();
    if (mirror) {
      this.file_ref = JSON.stringify([{
        name: this.name,
        type: mirror.type || this.getFileType({name: this.name}),
        size: mirror.size,
        src: mirror.src,
        previewSrc: mirror.previewSrc,
      }]);

      this.size = mirror.size;
      this.extention = mirror.extention || this.name.split('.').pop();
      this.type = mirror.type || this.getFileType({name: this.name});
      this.storage_driver = mirror.storage_driver;
      this.external_id = mirror.external_id;
      this.external_url = mirror.external_url;

      return true;
    }

    return false;
  }

  /**
   * Read a mirror file from disk. Defaults to this asset's own
   * mirror; `save()` passes an explicit name for the pre-upload
   * collision check. Returns the parsed metadata or null when the
   * mirror doesn't exist.
   */
  #readMirror(name = this.name) {
    if (!name) return null;
    const dir = loopar.getAssetPath({
      app: this.app,
      visibility: this.visible || 'public',
    });
    const mirrorPath = path.join(dir, `${name}.meta.json`);
    try {
      const raw = fs.readFileSync(mirrorPath, 'utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  async getList({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
    q ??= {};
    q.visible = this.visible || "public";

    const pagination = {
      page: loopar.session.get(this.__ENTITY__.name + "_page") || 1,
      pageSize: 10,
      totalPages: 1,
      totalRecords: 0,
      sortBy: "id",
      sortOrder: "asc",
      __ENTITY__: this.__ENTITY__.name
    };

    const listFields = this.getFieldListNames();
    const allRows = await this.loadDiskFiles([]);
    
    const nameFilter = (this.name || "").toLowerCase();
    const extFilter = (this.extention || "").toLowerCase();
    const filtered = allRows.filter(row =>
      (row.name || "").toLowerCase().includes(nameFilter) &&
      (row.extention || "").toLowerCase().includes(extFilter)
    );

    pagination.totalRecords = filtered.length;
    pagination.totalPages = Math.max(1, Math.ceil(filtered.length / pagination.pageSize));

    // Clamp the current page when filters shrink the set below it.
    if (pagination.page > pagination.totalPages) {
      pagination.page = 1;
      await loopar.session.set(this.__ENTITY__.name + "_page", 1);
    }

    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const rows = filtered.slice(startIndex, startIndex + pagination.pageSize);

    const selfPagination = JSON.parse(JSON.stringify(pagination));

    return Object.assign((rowsOnly ? {} : await this.__meta__()), {
      labels: this.getFieldListLabels(),
      fields: listFields,
      rows: rows,
      pagination: selfPagination,
      q
    });
  }

  async getPrivateFile() {
    return null;
  }
}