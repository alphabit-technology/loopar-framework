import {loopar} from 'loopar';
import BaseDocument from "@context/base/base-document";
import { dataInterface } from '@global/element-definition';
import Sanitize from "sanitize-filename";
import { buildFormData } from "@@tools/build-form-data";

export default class BaseForm extends BaseDocument {
  formFields = {};
  hasSidebar = true;
  __FORM_REFS__ = {};
  #Form = null;

  save() {
    this.send({ action: this.Document.meta.action });
  }

  set Form(Form) {
    this.#Form = Form;
  }

  /**
   * Returns `true` when at least one field has been modified relative to the
   * form's `defaultValues`. Backed by react-hook-form's `formState.dirtyFields`.
   */
  hasChanges() {
    const dirty = this.#Form?.formState?.dirtyFields;
    return !!dirty && Object.keys(dirty).length > 0;
  }

  checkChanges() {
    if (!this.notRequireChanges && !this.hasChanges()) {
      loopar.notify("No changes to save", "warning");
      return false;
    }

    return true;
  }

  /**
   * Submit the form to a controller action.
   *
   * @param {Object} opts
   * @param {string} opts.action - Controller action to invoke.
   * @param {Object} [opts.query] - Extra URL query params (merged with
   *   `this.queryParams`).
   * @param {Function} [opts.success]
   * @param {Function} [opts.error]
   */
  send({ action, query={}, ...options } = {}) {
    this.validate();

    if (!this.checkChanges()) return;

    const handleSuccess = (r) => {
      if (this.#Form) {
        this.#Form.reset(this.#Form.getValues(), { keepValues: true });
      }
      if (options.success) options.success(r);
    };

    const handleError = (r) => {
      if (options.error) options.error(r);
      else loopar.throw(r);
    };

    const mergedQuery = { ...this.queryParams, ...query };
    const body = this.#getFormData(true);

    const document = this.Document?.Entity?.name;

    if (document) {
      return loopar.call(document, action, body, {
        query: mergedQuery,
        success: handleSuccess,
        error: handleError,
        freeze: true,
      });
    }

    /* loopar.send({
      action,
      query: mergedQuery,
      body,
      success: handleSuccess,
      error: handleError,
      freeze: true,
    }); */
  }

  get queryParams() {
    const searchParams = new URLSearchParams(window.location.search);
    return {
      name: this.__DOCUMENT_NAME__,
      ...(Object.fromEntries(searchParams.entries()) || {}),
    }
  }

  validate() {
    const errors = [];
    const values = this.Form ? this.Form.getValues() : {};
    Object.entries(values).forEach(([key, value]) => {
      const field = this.__FIELD__(key);
      if (!field || !this.get(key)) return;
      field.value = value;

      if([FORM_TABLE].includes(field.def.element)) {
        /*const TableInput = this.get(key);

        console.log(["TableInput", TableInput]);
        const tableErrors = TableInput?.validate();

        if(tableErrors.length > 0) {
          errors.push(...tableErrors);
        }*/
      }else{
        field.element = field.def.element;
        const validator = dataInterface(field, value).validate();
        if (!validator.valid) {
          errors.push({
            field: field.data.name,
            message: validator.message
          });
        }
      }
    });

    if(errors.length > 0) {
      errors.forEach(e => this.setError(e.field, { message: e.message}));
      loopar.throw({
        type: 'error',
        title: 'Validation error',
        message: errors.map(e => e.message).join('\n')
      });
    }
  }

  getField(name) {
    return this.formFields.defaultValues[name] || null;
  }

  getValue(name) {
    return this.#Form ? this.#Form.getValues(name) : undefined;
  }

  getFormValues(toSave = false) {
    return this.#getFormValues(toSave);
  }

  buildDesignerToSave(structure, toSave = false) {
    const __files = [];
    const __remote = [];

    const fixFieldData = (field) => {
      const updatedData = field.data;

      for (const [key, value] of Object.entries(field.data || {})) {
        if (key === "background_image" && value) {
          const files = value;
          const filesToSave = [];

          if(files && Array.isArray(files) && files.length > 0) {
            for (const file of files) {
              if (typeof file === "string") continue;

              // Pending URL import (origin "Web"): stage it for the
              // server to import at save time. The clean metadata
              // entry kept in the designer is patched with the
              // resolved src/previewSrc once the import runs.
              if (file.importPending && file.src) {
                const cleanName = toSave
                  ? Sanitize(file.name || "file").replaceAll(/\s+/g, "-")
                  : (file.name || "file");
                __remote.push({
                  name: cleanName,
                  url: file.src,
                  mode: file.importMode || "reference",
                });
                filesToSave.push({ name: cleanName, type: file.type, importPending: true });
                continue;
              }

              if(file.src){
                const typeMatches = file.src.match(/^data:(.*);base64,/);
                const mimeType  = typeMatches ? typeMatches[1] : null;

                if (mimeType ) {
                  const base64Data = file.src.split(';base64,')[1];
                  const binaryString = atob(base64Data);
                  const len = binaryString.length;
                  const bytes = new Uint8Array(len);

                  for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                  }

                  const safeFileName = toSave ? Sanitize(file.name || "file").replaceAll(/\s+/g, "-") : file.name || "file";

                  const newFile = new File([bytes], safeFileName, { type: mimeType  });
                  __files.push(newFile);

                  filesToSave.push({
                    name: safeFileName,
                    size: newFile.size,
                    type: mimeType
                  });
                  continue;
                }
              }

              filesToSave.push(file)
            }

            filesToSave.length && (updatedData[key] = filesToSave);
          }
        }

        if([undefined, "undefined", null, "null", 0, "0", "[]"].includes(value)) {
          delete updatedData[key];
        }
      }

      return updatedData;
    };

    const fixElements = (elements = []) => {
      return elements.map(field => {
        const newField = { ...field, data: fixFieldData(field) };

        if (newField.elements && newField.elements.length > 0) {
          newField.elements = fixElements(newField.elements);
        } else {
          delete newField.elements;
        }

        return newField;
      });
    }

    return {files: __files, remote: __remote, designer: fixElements(structure)};
  }

  #getFormValues(toSave = false) {
    if(!this.Form)  return this.Document.data || {};

    let __FILES__ = [];
    let __REMOTE_FILES__ = [];

    const values = this.Form.getValues();

    return Object.entries(values).reduce((obj, [name, value]) => {
      const field = this.__FIELD__(name);

      if (!field) return obj;
      if(toSave) {
        if ([FILE_INPUT, IMAGE_INPUT].includes(field.def.element)) {
          const files = Array.isArray(value) ? value : [];
          const metaFiles = [];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.rawFile && file.rawFile instanceof File) {
              metaFiles.push({
                name: file.rawFile.name,
                size: file.rawFile.size,
                type: file.rawFile.type,
              });
              __FILES__.push(file.rawFile);
            } else if (file.importPending && file.src) {
              // Pending URL import — staged, imported server-side at save.
              metaFiles.push({
                name: file.name,
                type: file.type,
                importPending: true,
              });
              __REMOTE_FILES__.push({
                name: file.name,
                url: file.src,
                mode: file.importMode || "reference",
              });
            } else {
              metaFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                src: file.src
              });
            }
          }

          obj[name] = metaFiles.length > 0 ? JSON.stringify(metaFiles) : value;
          obj.__FILES__ = __FILES__;
          obj.__REMOTE_FILES__ = __REMOTE_FILES__;
          return obj
        }

        if(field.def.element === DESIGNER && toSave) {
          const {files, remote, designer} = this.buildDesignerToSave(JSON.parse(value), toSave);
          obj[name] = JSON.stringify(designer);
          __FILES__ = [...(__FILES__ || []), ...(files || [])];
          __REMOTE_FILES__ = [...(__REMOTE_FILES__ || []), ...(remote || [])];

          obj.__FILES__ = __FILES__;
          obj.__REMOTE_FILES__ = __REMOTE_FILES__;
          return obj;
        }
      }

      if([FORM_TABLE].includes(field.def.element) && toSave) {
        obj[name] = JSON.stringify(value || []);
        return obj;
      }

      if([CHECKBOX, SWITCH].includes(field.def.element)) {
        obj[name] = value ? 1 : 0;
        return obj;
      }

      obj.__FILES__ = __FILES__;
      obj.__REMOTE_FILES__ = __REMOTE_FILES__;
      obj[name] = value;
      return obj;
    }, {});
  }

  #getFormData(toSave) {
    return buildFormData(this.getFormValues(toSave));
  }

  get Form() {
    return this.#Form;
  }

  setError(name, error) {
    this.Form.control.setError(name, error);
  }

  setValue(name, value) {
    this.Form.setValue(name, value, {
      shouldDirty: true,
      shouldValidate: false
    });
  }

  componentDidMount() {
    super.componentDidMount();
    this.buildSettersAndGetters();
  }

  buildSettersAndGetters() {
    this.__WRITABLE_FIELDS__.forEach(field => {
      const fieldName = field.data.name;

      Object.defineProperty(this, fieldName, {
        get: () => {
          return this.#Form ? this.#Form.getValues(fieldName) : undefined;
        },
        set: (value) => {
          if (this.Form) {
            this.Form.setValue(fieldName, value, {
              shouldDirty: true,
              shouldValidate: true
            });
          }
        },
        enumerable: true,
        configurable: true
      });
    });
  }
}
