import { loopar } from 'loopar';
import { dataInterface } from '@global/element-definition';
import Sanitize from "sanitize-filename";
import { buildFormData } from "@@tools/build-form-data";
import { mixin } from "./mixin";
import { initDocumentController, documentControllerMethods } from "./document-controller";

/**
 * Form controller — document controller + react-hook-form bridge, submit,
 * validation and file/designer serialization. See `document-controller.jsx`
 * for the host contract. `FormProvider` assigns `docRef.Form` during render,
 * which is what wires the form instance in.
 */

export function initFormController(host) {
  initDocumentController(host);
  Object.assign(host, {
    formFields: {},
    hasSidebar: true,
    __FORM_REFS__: {},
    _form: null,
    /**
     * Which controller receives this form's submissions. Resolution order in
     * `send()` (first non-null wins): `opts.document` → `this.controller` →
     * `this.Document.Entity.name`. No fallback: a form without a resolvable
     * controller is an error.
     */
    controller: null,
  });
  return host;
}

export const formControllerMethods = {
  get Form() {
    return this._form;
  },

  set Form(Form) {
    this._form = Form;
  },

  /**
   * @param {Object} [options] - Forwarded to `send()`. Notables:
   *   `extra` (plain object merged into the outgoing body — e.g. anti-bot
   *   fields from a public form), `success`, `error`, `notRequireChanges`.
   *
   * Inside a modal mini-workspace (`this.props.inModal`) the server's
   * post-save redirect must NOT navigate the browser (the transport is a
   * global singleton — it would move the BASE page, not the modal). So the
   * redirect is suppressed (`followRedirect: false`) and the saved document's
   * name is reported to the modal's opener via `this.props.onSaved(name, r)`.
   */
  save(options = {}) {
    if (this.props.inModal) {
      const { success, ...rest } = options;
      return this.send({
        action: this.Document.meta.action,
        followRedirect: false,
        ...rest,
        success: (r) => {
          success?.(r);
          const name = r?.name
            ?? new URLSearchParams(String(r?.redirect || "").split("?")[1] || "").get("name");
          this.props.onSaved?.(name, r);
        },
      });
    }

    return this.send({ action: this.Document.meta.action, ...options });
  },

  /** `true` when at least one field differs from the form's `defaultValues`. */
  hasChanges() {
    const dirty = this._form?.formState?.dirtyFields;
    return !!dirty && Object.keys(dirty).length > 0;
  },

  checkChanges() {
    if (!this.notRequireChanges && !this.hasChanges()) {
      loopar.notify("No changes to save", "warning");
      return false;
    }
    return true;
  },

  /**
   * Submit the form to a controller action.
   *
   * @param {Object} opts
   * @param {string} [opts.document] - Target controller name (overrides
   *   `this.controller` and the implicit `Document.Entity.name`).
   * @param {string} opts.action - Controller action to invoke.
   * @param {Object} [opts.query] - Extra URL query params (merged with `this.queryParams`).
   * @param {Object} [opts.extra] - Plain object appended to the outgoing body
   *   AFTER the form values (fields not declared in the entity travel here).
   * @param {Function} [opts.success]
   * @param {Function} [opts.error]
   */
  send({ document, action, query = {}, extra = null, ...options } = {}, successCallback, errorCallback) {
    this.validate();

    if (!options.notRequireChanges && !this.checkChanges()) return;

    const handleSuccess = (r) => {
      if (this._form && !options.notRequireChanges) {
        this._form.reset(this._form.getValues(), { keepValues: true });
      }
      if (options.success) options.success(r);
      if (successCallback) successCallback(r);
    };

    const handleError = (r) => {
      if (options.error) options.error(r);
      if (errorCallback) errorCallback(r);
      else loopar.throw(r);
    };

    const mergedQuery = { ...this.queryParams, ...query };
    const body = this._getFormData(true);

    if (extra && typeof extra === "object") {
      for (const [key, value] of Object.entries(extra)) {
        if (value === undefined || value === null) continue;
        body.append(key, value);
      }
    }

    // Every submission MUST name its controller — the RPC channel is
    // /{Document}/{action}. Fail loudly instead of sending a broken request.
    const targetDocument = document || this.controller || this.Document?.Entity?.name;

    if (!targetDocument) {
      return loopar.throw({
        title: "Form without target controller",
        message: `Cannot send action "${action}": declare \`controller\` on the form or pass \`document\` to send().`,
      });
    }

    return loopar.call(targetDocument, action, {
      body,
      query: mergedQuery,
      success: handleSuccess,
      error: handleError,
      freeze: true,
      ...(options.followRedirect === false ? { followRedirect: false } : {}),
    });
  },

  get queryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      name: this.__DOCUMENT_NAME__,
      ...(Object.fromEntries(searchParams.entries()) || {}),
    };
  },

  validate() {
    const errors = [];
    const values = this.Form ? this.Form.getValues() : {};
    Object.entries(values).forEach(([key, value]) => {
      const field = this.__FIELD__(key);
      if (!field || !this.get(key)) return;
      field.value = value;

      if ([FORM_TABLE].includes(field.def.element)) {
        // Table inputs validate their own rows.
      } else {
        field.element = field.def.element;
        const validator = dataInterface(field, value).validate();
        if (!validator.valid) {
          errors.push({ field: field.data.name, message: validator.message });
        }
      }
    });

    if (errors.length > 0) {
      errors.forEach(e => this.setError(e.field, { message: e.message }));
      loopar.throw({
        type: 'error',
        title: 'Validation error',
        message: errors.map(e => e.message).join('\n')
      });
    }
  },

  getField(name) {
    return this.formFields.defaultValues[name] || null;
  },

  getValue(name) {
    return this._form ? this._form.getValues(name) : undefined;
  },

  getFormValues(toSave = false) {
    return this._getFormValues(toSave);
  },

  buildDesignerToSave(structure, toSave = false) {
    const __files = [];
    const __remote = [];

    const fixFieldData = (field) => {
      const updatedData = field.data;

      for (const [key, value] of Object.entries(field.data || {})) {
        if (key === "background_image" && value) {
          const files = value;
          const filesToSave = [];

          if (files && Array.isArray(files) && files.length > 0) {
            for (const file of files) {
              if (typeof file === "string") continue;

              // Pending URL import (origin "Web"): staged for the server to
              // import at save time.
              if (file.importPending && file.src) {
                const cleanName = toSave
                  ? Sanitize(file.name || "file").replaceAll(/\s+/g, "-")
                  : (file.name || "file");
                __remote.push({ name: cleanName, url: file.src, mode: file.importMode || "reference" });
                filesToSave.push({ name: cleanName, type: file.type, importPending: true });
                continue;
              }

              if (file.src) {
                const typeMatches = file.src.match(/^data:(.*);base64,/);
                const mimeType = typeMatches ? typeMatches[1] : null;

                if (mimeType) {
                  const base64Data = file.src.split(';base64,')[1];
                  const binaryString = atob(base64Data);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);

                  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

                  const safeFileName = toSave ? Sanitize(file.name || "file").replaceAll(/\s+/g, "-") : file.name || "file";
                  const newFile = new File([bytes], safeFileName, { type: mimeType });
                  __files.push(newFile);
                  filesToSave.push({ name: safeFileName, size: newFile.size, type: mimeType });
                  continue;
                }
              }

              filesToSave.push(file);
            }

            filesToSave.length && (updatedData[key] = filesToSave);
          }
        }

        if ([undefined, "undefined", null, "null", 0, "0", "[]"].includes(value)) {
          delete updatedData[key];
        }
      }

      return updatedData;
    };

    const fixElements = (elements = []) => elements.map(field => {
      const newField = { ...field, data: fixFieldData(field) };
      if (newField.elements && newField.elements.length > 0) {
        newField.elements = fixElements(newField.elements);
      } else {
        delete newField.elements;
      }
      return newField;
    });

    return { files: __files, remote: __remote, designer: fixElements(structure) };
  },

  _getFormValues(toSave = false) {
    if (!this.Form) return this.Document.data || {};

    let __FILES__ = [];
    let __REMOTE_FILES__ = [];

    const values = this.Form.getValues();

    return Object.entries(values).reduce((obj, [name, value]) => {
      const field = this.__FIELD__(name);

      if (!field) return obj;
      if (toSave) {
        if ([FILE_INPUT, IMAGE_INPUT].includes(field.def.element)) {
          const files = Array.isArray(value) ? value : [];
          const metaFiles = [];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.rawFile && file.rawFile instanceof File) {
              metaFiles.push({ name: file.rawFile.name, size: file.rawFile.size, type: file.rawFile.type });
              __FILES__.push(file.rawFile);
            } else if (file.importPending && file.src) {
              metaFiles.push({ name: file.name, type: file.type, importPending: true });
              __REMOTE_FILES__.push({ name: file.name, url: file.src, mode: file.importMode || "reference" });
            } else {
              metaFiles.push({ name: file.name, size: file.size, type: file.type, src: file.src });
            }
          }

          obj[name] = metaFiles.length > 0 ? JSON.stringify(metaFiles) : value;
          obj.__FILES__ = __FILES__;
          obj.__REMOTE_FILES__ = __REMOTE_FILES__;
          return obj;
        }

        if (field.def.element === DESIGNER && toSave) {
          const { files, remote, designer } = this.buildDesignerToSave(JSON.parse(value), toSave);
          obj[name] = JSON.stringify(designer);
          __FILES__ = [...(__FILES__ || []), ...(files || [])];
          __REMOTE_FILES__ = [...(__REMOTE_FILES__ || []), ...(remote || [])];

          obj.__FILES__ = __FILES__;
          obj.__REMOTE_FILES__ = __REMOTE_FILES__;
          return obj;
        }
      }

      if ([FORM_TABLE].includes(field.def.element) && toSave) {
        obj[name] = JSON.stringify(value || []);
        return obj;
      }

      if ([CHECKBOX, SWITCH].includes(field.def.element)) {
        obj[name] = value ? 1 : 0;
        return obj;
      }

      obj.__FILES__ = __FILES__;
      obj.__REMOTE_FILES__ = __REMOTE_FILES__;
      obj[name] = value;
      return obj;
    }, {});
  },

  _getFormData(toSave) {
    return buildFormData(this.getFormValues(toSave));
  },

  setError(name, error) {
    this.Form.control.setError(name, error);
  },

  setValue(name, value) {
    this.Form.setValue(name, value, { shouldDirty: true, shouldValidate: false });
  },

  /**
   * Exposes every writable field as a property of the controller
   * (`ctrl.user_name` ↔ `form.getValues/setValue`). Kept for the legacy
   * class views; functional views should prefer `getValue/setValue`.
   */
  buildSettersAndGetters() {
    this.__WRITABLE_FIELDS__.forEach(field => {
      const fieldName = field.data.name;

      Object.defineProperty(this, fieldName, {
        get: () => (this._form ? this._form.getValues(fieldName) : undefined),
        set: (value) => {
          if (this.Form) {
            this.Form.setValue(fieldName, value, { shouldDirty: true, shouldValidate: true });
          }
        },
        enumerable: true,
        configurable: true
      });
    });
  },

  mount() {
    documentControllerMethods.mount.call(this);
    this.buildSettersAndGetters();
  },
};

/** Standalone form controller for functional hosts (see `createDocumentController`). */
export function createFormController(env, overrides) {
  const host = {};
  Object.defineProperty(host, "props", { get: () => env.props, configurable: true });
  host.rerender = env.rerender;
  initFormController(host);
  mixin(host, documentControllerMethods);
  mixin(host, formControllerMethods);
  return mixin(host, overrides);
}
