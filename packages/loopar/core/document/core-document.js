'use strict'
import DynamicField from './dynamic-field.js';
import { loopar } from '../loopar.js';
import { fileManage } from '../file-manage.js';
import { parseDocStructure, stripEphemeralDocStructure } from './tools.js';
import { FRAMEWORK_OWNED_COLUMN_NAMES } from '../global/audit.js';

export default class CoreDocument {
  #fields = {};
  #protectedPassword = "********";

  constructor(props) {
    Object.assign(this, props);
  }

  get fields() {
    return this.#fields;
  }

  get protectedPassword() {
    return this.#protectedPassword
  }

  async onLoad() {

  }

  trigger(event, ...args) {
    if (this[event] && typeof this[event] === 'function') {
      this[event](event, ...args);
    }
  }

  async setApp() {
    const __REF__ = this.__ENTITY__.__REF__;

    if (loopar.installing) {
      this.__APP__ = loopar.installingApp;
      return;
    }

    if (this.__ENTITY__.name === "App") {
      /**
       * If is an Entity type App, the app name is the same as the document name
       */
      this.__APP__ = this.name;
    } else if (this.is_builder) {
      /**
       * If is a Entity type Entity, the app name is the same as the module name
       */
      if (this.name === "Entity") {
        this.__APP__ = "loopar";
      } else {
        this.__APP__ ??= await loopar.db.getValue("Module", "app_name", this.module);
      }
    } else if (this.__ENTITY__.name === "Module") {
      this.__APP__ = this.app_name;
    } else {
      if (__REF__?.__APP__) {
        this.__APP__ = __REF__.__APP__;
      } else {
        this.__APP__ ??= await loopar.db.getValue("Module", "app_name", this.__ENTITY__.module);
      }
    }
  }

  async __init__() {
    await this.#makeFields(loopar.utils.JSONparse(this.__ENTITY__.doc_structure, []));

    this.#defineFrameworkOwnedProps();

    if (this.__DATA__ && this.__DATA__.doc_structure) {
      const parsed = JSON.parse(this.__DATA__.doc_structure);
      // stripEphemeralDocStructure: incoming structures (designer save)
      // may carry render-injected payloads — getList rows on Server
      // galleries, collection preloads, cookie indexes — that must not
      // be persisted with the document.
      this.__DATA__.doc_structure = JSON.stringify(
        stripEphemeralDocStructure(parsed.filter(field => (field.data || {}).name !== ID))
      );
    }

    await this.setApp();
    await this.onLoad();
  }

  async getConnectedDocuments() {
    const refs = Object.values(loopar.getRefs());
    const relatedEntities = [];

    for (const ref of refs) {
      const ent = await fileManage.getConfigFile(ref.__NAME__, ref.__ROOT__);
      const fields = loopar.utils.fieldList(ent.doc_structure);

      fields.filter(field => (field.element === SELECT || field.element === FORM_TABLE) && field.data.options).map(field => {
        const options = Array.isArray(field.data.options) ? field.data.options : (field.data.options || "").split("\n")[0];
        if (options === this.__ENTITY__.name) {
          relatedEntities.push({
            is_single: ref.is_single,
            entity: ref.__NAME__,
            field: field.data.name,
          })
        }
      });
    }

    const rels = [];
    for (const r of relatedEntities) {
      if(r.entity === "Document History") continue;

      const docs = await loopar.db.getAll(r.entity, ["name"], {
        [r.field]: this.name
      }, { isSingle: r.is_single });

      rels.push(...docs.filter(doc => doc.name).map(doc => {
        return {
          entity: r.entity,
          name: doc.name,
        }
      }));
    }

    return rels
  }

  async #makeField({ field, fieldName = field.data.name, value = null } = {}) {
    const nameToGet = (name) => {
      return loopar.utils.Capitalize(name.replaceAll(/_./g, match => match.charAt(1).toUpperCase()))
    }

    const checkIfFieldExistLikeAttribute = Object.getOwnPropertyDescriptor(this, fieldName);

    if(checkIfFieldExistLikeAttribute) {
      loopar.throw(`
        The field name ${fieldName} is already used as attribute of the ${this.__ENTITY__.name} document
        please change the name of the field in the doc_structure of the ${this.__ENTITY__.name} Entity
        or rename your attribute in the ${this.__ENTITY__.name} class.
      `)
    }

    if (!this.#fields[fieldName]) {
      if (field.element === FORM_TABLE) {
        const val = loopar.utils.isJSON(value) ? JSON.parse(value) : value;

        this.#fields[fieldName] = new DynamicField(
          field,
          (Array.isArray(val) && val.length > 0) ? value : this.__DATA__[fieldName]
        );
      } else {
        this.#fields[fieldName] = new DynamicField(field, value || this.__DATA__[fieldName]);
      }

      Object.defineProperty(this, `get${nameToGet(fieldName)}`, {
        get: () => {
          return this.#fields[fieldName];
        }
      });

      if(field.element === FORM_TABLE) {
        Object.defineProperty(this, fieldName, {
          get: async () => {
            const field = this.#fields[fieldName];
            const currentValue = field.value;
            if((!currentValue || currentValue.length === 0) && !this.__IS_NEW__) {
              return await this.getChildValues(field.options);
            }
            return field.value;
          },
          set: (val) => {
            if (Array.isArray(val)) {
              this.#fields[fieldName].value = val;
            } else {
              const v = loopar.utils.isJSON(val) ? JSON.parse(val) : [];
              if (Array.isArray(v)) {
                this.#fields[fieldName].value = v;
              }
            }
          },
          configurable: false,
          enumerable: true 
        });
      }else{
        Object.defineProperty(this, fieldName, {
          get: () => {
            return this.#fields[fieldName].value;
          },
          set: (val) => {
            this.#fields[fieldName].value = val;
          },
          configurable: false,
          enumerable: true 
        });
      }
    }
  }

  getDocypeStructure() {
    return loopar.utils.JSONparse(this.__ENTITY__.doc_structure, []).filter(field => field.data.name !== ID);
  }

  /**
   * Define `this.id` and `this.__created_at__` / `__updated_at__` /
   * `__deleted_at__` / `__document_status__` as enumerable getter/setter
   * pairs backed by __DATA__. Mirrors what #makeField does for declared
   * fields — minus the DynamicField wrapper, since these are plain scalar
   * columns with no UI metadata to attach.
   *
   * Safe to call even when an entity isn't auditable: a non-auditable
   * table simply won't have those columns in __DATA__, the getters
   * resolve to undefined, and nothing breaks. Defining them
   * unconditionally keeps this code branchless.
   *
   * Idempotent: if a property was already defined (subclass override,
   * field collision, etc.), we leave it alone so we never clobber
   * existing behavior.
   */
  #defineFrameworkOwnedProps() {
    for (const name of FRAMEWORK_OWNED_COLUMN_NAMES) {
      if (Object.getOwnPropertyDescriptor(this, name)) continue;
      Object.defineProperty(this, name, {
        get: () => this.__DATA__?.[name],
        set: (val) => {
          if (!this.__DATA__) this.__DATA__ = {};
          this.__DATA__[name] = val;
        },
        configurable: false,
        enumerable: true,
      });
    }
  }

  async #makeFields(fields = this.getDocypeStructure()) {
    const entityFields = this.__ENTITY__.__REF__.__FIELDS__;

    await Promise.all(fields.map(async (field) => {
      if ((fieldIsWritable(field) || field.element === FORM_TABLE) && entityFields.includes(field.data.name)) {
        if(field.element !== SLOT || field.data.writable)
          await this.#makeField({ field });
      }

      await this.#makeFields(field.elements || []);
    }));
  }

  nameIsNull() {
    return (!this.name || this.name === "undefined") || this.name.length === 0;
  }

  setUniqueName() {
    if (this.nameIsNull() && (this.__IS_NEW__ || this.__ENTITY__.is_single) && this.getName?.hidden === 1) {
      this.name = loopar.utils.randomString(12);
    }
  }

  async __ID__() {
    // `this.id` is the cached value loaded with the doc; trust it when set
    // regardless of __IS_NEW__. The DB fallback covers two cases:
    //   1. A fresh doc that just got insertRow'd — id was assigned on the
    //      payload but not pushed back to `this`, so `this.id` is still
    //      undefined. getValue picks it up by name.
    //   2. A doc loaded from a stale ref cache whose __FIELDS__ predates
    //      the id-as-framework refactor and therefore didn't SELECT `id`.
    //      Without this fallback, deleteChildRecords would issue a
    //      `DELETE FROM <child> WHERE parent_id = undefined` and Knex
    //      would bail with "Undefined binding(s) detected".
    if (this.id != null) return this.id;
    return await loopar.db.getValue(this.__ENTITY__.name, "id", this.__DOCUMENT_NAME__);
  }

  async deleteChildRecords(force = false) {
    const ID = await this.__ID__();
    const childValuesReq = this.childValuesReq;

    if (Object.keys(childValuesReq).length === 0) return;

    if (ID == null) return;

    for (const [key, value] of Object.entries(childValuesReq)) {
      if(key == this.name) continue;
      if(!await loopar.db.hasTable(key)) continue;

      const values = loopar.utils.isJSON(value) ? JSON.parse(value) : Array.isArray(value) ? value : null;

      if (values || force) {
        await loopar.db.raw(
          `DELETE FROM ${loopar.db.tableName(key)} WHERE parent_id = ?`,
          [ID]
        );
      }
    }
  }

  async save() {
    const args = arguments[0] || {};
    const validate = args.validate !== false;

    const updateRows = async (Ent, rows, parentType, parentId) => {
      const nextId = await loopar.db.nextId(Ent);
      const cleanParentId = Number.isFinite(+parentId) ? parseInt(parentId, 10) : parentId;
      for (const [index, row] of rows/*.sort((a, b) => a.id - b.id)*/.entries()) {
        row.id = nextId + index;
        row.name = loopar.utils.randomString(15);
        row.parent_document = parentType;
        row.parent_id = cleanParentId;

        const document = await loopar.newDocument(Ent, row);
        await document.save(args.forceChildren ? { forceChildren: true } : undefined);
      }
    }
    
    const updateChildRecords = async (childValuesReq, parentType, parentId) => {
      for (const [key, value] of Object.entries(childValuesReq)) {
        if(key == this.name) continue;
        if(!await loopar.db.hasTable(key)) continue;

        const rows = loopar.utils.isJSON(value) ? JSON.parse(value) : Array.isArray(value) ? value : null;
        if(!rows) continue;

        await updateRows(key, rows, parentType, parentId);
      }
    }

    this.setUniqueName();
    this.beforeSave && await this.beforeSave();
    if (validate) await this.validate();

    if (this.__IS_NEW__ || this.__ENTITY__.is_single) {
      await loopar.db.insertRow(this.__ENTITY__.name, this.stringifyValues(true), this.__ENTITY__.is_single);
      this.__DOCUMENT_NAME__ = this.name;
    } else {
      const data = this.valuesToSetDataBase(true);

      if (Object.keys(data).length) {
        await loopar.db.updateRow(
          this.__ENTITY__.name,
          this.__DOCUMENT_NAME__,
          data,
          this.__ENTITY__.is_single
        );
      }
    }

    if (!loopar.installing || args.forceChildren) {
      const childValuesReq = this.childValuesReq;

      if (Object.keys(childValuesReq).length) {
        await this.deleteChildRecords();
        await updateChildRecords(childValuesReq, this.__ENTITY__.name, await this.__ID__());
      }
    }

    const uploadedRefs = await this.saveFiles();
    if (uploadedRefs.length > 0) {
      await this.#patchUploadedFileRefs(uploadedRefs);
    }


    if (this.installerApp && !loopar.installing) {
      const app = await loopar.getDocument("App", this.installerApp, null, { ifNotFound: null });
      app && app.bump("patch");
    }

    this.afterSave && await this.afterSave();
  }

  /**
   * The app this record installs into, or `null`.
   *
   * A record belongs to an app's installer when its entity is flagged
   * `include_in_installer` AND the record itself carries an `app`
   * reference (e.g. a `Project` created *for* a specific app). This
   * getter is the single source of truth for two coupled decisions:
   *   - bumping the owning app's version on save (see above), and
   *   - scoping uploaded files to that app (see `getFileScopeApp`).
   *
   * Keeping both off the same condition guarantees a record and its
   * files never drift apart — if the record travels in the
   * installer, its assets travel with it.
   */
  get installerApp() {
    return (this.__ENTITY__?.include_in_installer === 1 && this.app)
      ? this.app
      : null;
  }

  /**
   * App scope for files saved through this document.
   *
   * **Runtime attachments → site.** When the record is plain tenant
   * data (a profile picture, an end-user file input) this returns
   * `null` and files land under `{tenant}/uploads/...`.
   *
   * **Installer records → their app.** When the record belongs to an
   * app's installer (`installerApp`), its files must travel with the
   * app's code/installer, so they go to `apps/{app}/uploads/...`
   * instead of being orphaned in the site.
   *
   * `Entity` overrides this to return its owning app, because
   * anything saved through Entity (page builders, designed
   * entities, …) is *design-time content* resolved from `module`.
   *
   * Async because subclasses may need a DB lookup (e.g. Entity
   * resolves the app from its `module`).
   */
  async getFileScopeApp() {
    return this.installerApp;
  }

  /**
   * Persist files that arrived with the request:
   *   - `__REQ_FILES__`   — binary uploads (multipart).
   *   - `__REMOTE_FILES__` — deferred URL imports staged by the
   *     "Web" origin of the file picker.
   *
   * Both are scoped by `getFileScopeApp()` and return the same
   * `{ name, src, previewSrc, type, size }` ref shape, so the caller
   * (`#patchUploadedFileRefs`) can backfill designer/file-input
   * fields that reference assets by name only.
   */
  async saveFiles() {
    const app = await this.getFileScopeApp();
    const uploadedRefs = [];

    const files = this.__DATA__.__REQ_FILES__ || [];
    for (const file of files) {
      const ref = await this._processFile(file, app);
      if (ref) uploadedRefs.push(ref);
    }

    for (const remote of this.#remoteFilesFromData()) {
      const ref = await this._processRemoteFile(remote, app);
      if (ref) uploadedRefs.push(ref);
    }

    return uploadedRefs;
  }

  /**
   * Parse the `__REMOTE_FILES__` payload (a JSON string of
   * `{ name, url, mode }` entries) staged by `base-form.jsx`.
   */
  #remoteFilesFromData() {
    const raw = this.__DATA__.__REMOTE_FILES__;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  /**
   * Import one staged URL through the `File Manager` entity's
   * `remoteImport` path. `mode` ("reference" / "download") selects
   * the driver; `app` scopes the asset. Returns the resolved ref or
   * null.
   */
  async _processRemoteFile(remote, app = null) {
    if (!remote || !remote.url) return null;

    const fileManager = await loopar.newDocument("File Manager");
    fileManager.remoteImport = {
      url: remote.url,
      name: remote.name,
      mode: remote.mode,
    };
    if (app) fileManager.app = app;
    await fileManager.save();

    try {
      const ref = JSON.parse(fileManager.file_ref || '[{}]')[0] || {};
      if (ref.src) {
        return {
          name: fileManager.name,
          src: ref.src,
          previewSrc: ref.previewSrc,
          type: ref.type || fileManager.type,
          size: ref.size || fileManager.size,
        };
      }
    } catch {}
    return null;
  }

  /**
   * Shared helper for `saveFiles()` and any subclass override. Uploads
   * one binary through the active storage driver via the `File Manager`
   * entity, then returns the resolved `{ name, src, previewSrc, type,
   * size }` so the caller can patch designer fields that referenced
   * the file by name only.
   *
   * `app` is the scope: null routes to tenant (site), a non-empty
   * string routes to `apps/{app}/uploads/`.
   */
  async _processFile(file, app = null) {
    const fileManager = await loopar.newDocument("File Manager");
    fileManager.reqUploadFile = file;
    if (app) fileManager.app = app;
    await fileManager.save();

    try {
      const ref = JSON.parse(fileManager.file_ref || '[{}]')[0] || {};
      if (ref.src) {
        return {
          name: fileManager.name,
          src: ref.src,
          previewSrc: ref.previewSrc,
          type: ref.type || fileManager.type,
          size: ref.size || fileManager.size,
        };
      }
    } catch {}
    return null;
  }

  /**
   * After files are uploaded through `loopar.storage.active`, the
   * driver decides the final URL (local `/assets/...` or remote
   * `https://res.cloudinary.com/...`). The page-builder designer and
   * regular file inputs strip the `src` field when they serialize the
   * form (the client only keeps `{ name, size, type }` — see
   * `base-form.jsx#buildDesignerToSave`), so the doc we just saved to
   * the DB has dangling references that the renderer can't resolve
   * for non-local drivers.
   *
   * This method walks every JSON-encoded string field on `__DATA__`
   * and patches any `{ name }` object whose name matches one of the
   * files we just uploaded, injecting `src` + `previewSrc`. Affected
   * fields are then re-written to the DB so subsequent reads see the
   * resolved URLs.
   *
   * Discrimination: only items that look like file references
   * (`{ name, size, type }` shape, missing `src`) are patched, so we
   * don't accidentally rewrite unrelated objects that happen to share
   * a `name` property.
   */
  async #patchUploadedFileRefs(uploadedRefs) {
    const byName = new Map(uploadedRefs.map(r => [r.name, r]));

    const isFileRefShape = (obj) =>
      obj && typeof obj === 'object' && !Array.isArray(obj)
      && typeof obj.name === 'string'
      && (obj.size !== undefined || obj.type !== undefined || obj.importPending === true)
      && !obj.src;

    let touched = false;

    const walk = (node) => {
      if (Array.isArray(node)) {
        for (const item of node) {
          if (isFileRefShape(item) && byName.has(item.name)) {
            const r = byName.get(item.name);
            item.src = r.src;
            item.previewSrc = r.previewSrc;
            
            if (item.importPending) delete item.importPending;
            touched = true;
          }
          walk(item);
        }
      } else if (node && typeof node === 'object') {
        for (const k of Object.keys(node)) {
          walk(node[k]);
        }
      }
    };

    const patches = {};
    for (const [key, value] of Object.entries(this.__DATA__ || {})) {
      if (typeof value !== 'string') continue;
      const trimmed = value.trimStart();
      if (!trimmed.startsWith('[') && !trimmed.startsWith('{')) continue;

      let parsed;
      try { parsed = JSON.parse(value); } catch { continue; }

      touched = false;
      walk(parsed);

      if (touched) {
        patches[key] = JSON.stringify(parsed);
        this.__DATA__[key] = patches[key];
      }
    }

    if (Object.keys(patches).length > 0) {
      await loopar.db.updateRow(
        this.__ENTITY__.name,
        this.__DOCUMENT_NAME__,
        patches,
        this.__ENTITY__.is_single
      );
    }
  }

  fieldsName() {

  }

  async validate() {
    const errors = Object.values(this.#fields)
      .filter(field => field.name !== ID).map(e => e.validate())
      .filter(e => !e.valid).map(e => e.message);

    const selectTypes = await this.validateLinkDocuments();
    !loopar.installing && errors.push(...selectTypes);

    errors.length > 0 && loopar.throw(errors.join('<br/>'));
  }

  async validateLinkDocuments() {
    const errors = [];
    for (const field of Object.values(this.#fields)) {
      if (field.element === SELECT && field.options && typeof field.options === 'string') {
        const value = field.formattedValue;
        const options = (field.options || "").split("\n");

        if (!value || value === "") continue;

        if (options.length > 1) {
          const keys = options.map(opt => {
            return opt.split(":")[0]
          });

          if (!keys.includes(value)) {
            errors.push(`The value ${value} for ${field.name} can only be one of the list of options`);
          }
        } else {
          const errForNotValidDocument = `The field ${field.name} does not have a valid document configured, please check the document metadata or contact an Administrator.`;

          if (options[0] === "") {
            errors.push(errForNotValidDocument);
          } else {
            if (await loopar.db.hasEntity(null,options[0]) === 0) {
              errors.push(errForNotValidDocument);
            } else {
              const link = await loopar.db.hasEntity(field.options, value);

              if (link === 0) {
                errors.push(`The value ${value} for ${field.name} does not exist in ${field.options} Entity`);
              }
            }
          }
        }
      }
    }

    return errors;
  }

  async delete() {
    const { sofDelete, force, build = true } = arguments[0] || {};
    const connections = await this.getConnectedDocuments();

    let message = connections.map((e, index) => {
      return `<a href='/desk/${e.entity}/update?name=${e.name}'>${index+1}: <strong>${e.entity}</strong>.${e.name}</a>`;
    }).join("<br/>");
    
    message = `<h2>Is not possible to delete ${this.__ENTITY__.name}.${this.name} because it is connected to:</h2><br/> ${message}`;

    if (connections.length > 0 && !force) {
      loopar.throw({
        ...{ VALIDATION_ERROR },
        message: message
      });
      return;
    }

    await loopar.db.beginTransaction();
    await this.deleteChildRecords(true);
    await loopar.db.deleteRow(this.__ENTITY__.name, this.__DOCUMENT_NAME__, sofDelete);

    await loopar.db.endTransaction();
    console.log(["Deleting", this.__ENTITY__.name, this.name]);

    await this.trigger('afterDelete', this);
  }

  async __meta__(withData = true) {
    const entity = this.__ENTITY__;
    const __DATA__ = await this.values();
      
    if (!this.__IS_NEW__) {
      const updateValue = async (structure) => {
        return Promise.all(structure.map(async (el) => {
          const data = el.data;
          const val = __DATA__[data.name];
      
          if (el.element === SELECT) {
            const options = (data.options || "").split("\n");
    
            if (options.length > 1) {
              const [value, label] = (options.find(opt => (opt || "").split(":")[0] === val) || "").split(":");
              el.data.value_descriptive = label || value;
            } else {
              // const db = loopar.db;
              // if (await db.hasEntity(null, data.options) && await db.count(data.options, data.value) > 0) {
              //   const doc = await loopar.getDocument(data.options, data.value);
              //   el.data.value_descriptive = await doc.getValueDescriptive();
              // }
            }
          }
          if(el.element === FORM_TABLE) {
            const ref = loopar.getRef(data.options);
            el.__META__ = {
              Entity: {
                doc_structure: await loopar.db.getValue(ref.__ENTITY__, "doc_structure", ref.__NAME__),
              }
            }
          }
      
          el.elements = await updateValue(el.elements || []);
          return el;
        }));
      };
  
      const updateDocStructure = async () => {
        entity.doc_structure = JSON.stringify(await updateValue(
          loopar.utils.JSONparse(entity.doc_structure, [])
        ));
      };

      await updateDocStructure();
    }

    const __ENTITY__ = entity;
    delete __ENTITY__.__REF__;
    
    return {
      name: this.__DOCUMENT_NAME__,
      isNew: this.__IS_NEW__,
      Entity: {
        id: __ENTITY__.id,
        name: __ENTITY__.name,
        module: __ENTITY__.module,
        doc_structure: __ENTITY__.doc_structure,
        ...(this.is_builder ? {is_builder: true} : {}),
        is_single: __ENTITY__.is_single
      },
      ...(withData || 1==1 ? { data: await this.rawValues() } : {}),
      //data: await this.rawValues(),
      spacing: this.__SPACING__
    }
  }

  async values(raw=false) {
    const value = async (field) => {
      if (field.element === DESIGNER) {
        return field.value ? JSON.stringify(await parseDocStructure(field.value, false)) : "[]";
      } else if (field.element === FORM_TABLE || field.element == REVIEW) {
        return await this.getChildValues(field.options);
      }
      
      /*else if (field.element === SELECT) {
        if (field.options && typeof field.options === 'string') {
          const options = (field.options || "").split("\n");

          if (options.length === 1) {
            const value = await loopar.db.getValue(field.options, "name", field.value);
            return JSON.stringify({ option: field.value, title: value });
          }
        }

        return JSON.stringify({ option: field.value, value: field.value });
      }*/
      else if (field.element === PASSWORD) {
        return raw ? field.value : (field.value && field.value.length > 0 ? this.protectedPassword : "");
      } else if(field.element === MARKDOWN){
        return field.value;
      } else {
        return field.stringifyValue();
      }
    }

    return Object.values(this.#fields).reduce(async (acc, cur) => {
      return { ...await acc, [cur.name]: await value(cur) }
    }, {});
  }

  async rawValues() {
    const value = async (field) => {
      if (field.element === DESIGNER) {
        const fieldValue = loopar.utils.JSONparse(field.value, field.value)
        return field.value ? JSON.stringify(fieldValue.filter(field => (field.data || []).name !== ID)) : "[]";
      } else if (field.element === FORM_TABLE) {
        return await this.getChildRawValues(field.options);
      } else if (field.element === PASSWORD) {
        return field.value && field.value.length > 0 ? this.protectedPassword : "";
      } else {
        return field.stringifyValue();
      }
    }
    return Object.values(this.#fields).reduce(async (acc, cur) => {
      return { ...await acc, [cur.name]: await value(cur) }
    }, {});
  }

  async getChildValues(field) {
    return await loopar.getListToForm(field, {
      filters: {
        parent_id: await this.__ID__()
      }
    })
  }

  async getChildRawValues(field) {
    return await loopar.db.getAll(field, ["*"], {
      parent_id: await this.__ID__()
    })
  }

  stringifyValues(toSave = false) {
    return Object.values(this.#fields)
      .filter(field => field.element !== FORM_TABLE)
      .filter(field => (field.element === PASSWORD ? field.value != this.protectedPassword : true))
      .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue(toSave) }), {});
  }

  valuesToSetDataBase(toSave = false) {
    return Object.values(this.#fields).filter(field => {
      if ((this.__IS_NEW__ && field.set_only_time) || field.element === FORM_TABLE) return false;

      if (field.type === PASSWORD) {
        return field.value !== this.protectedPassword;
      }

      return true;
    }).reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue(toSave) }), {});
  }

  get childValuesReq() {
    return Object.values(this.#fields)
      .filter(field => field.name !== ID && field.element === FORM_TABLE)
      .reduce((acc, cur) => ({ ...acc, [cur.options]: cur.value }), {});
  }

  get formattedValues() {
    return Object.values(this.#fields)
      //.filter(field => field.name !== ID)
      .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.formattedValue }), {});
  }
}