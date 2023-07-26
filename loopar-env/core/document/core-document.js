'use strict'

import DynamicField from './dynamic-field.js';
import { loopar } from '../loopar.js';

export default class CoreDocument {
   #fields = {};
   documentType = "Document";
   fieldDocStructure = 'doc_structure';
   protectedPassword = "********";

   constructor(props) {
      Object.assign(this, props);

      this.make();
   }

   get fields() {
      return this.#fields;
   }

   onLoad() {

   }

   trigger(event, ...args) {
      if (this[event] && typeof this[event] === 'function') {
         this[event](event, ...args);
      }
   }

   async setApp() {
      if (this.__DOCTYPE__.name === "App") {
         /**
          * If is an App type Document, the app name is the same as the document name
          */
         this.__APP__ = this.name;
      } else if (this.__DOCTYPE__.name === "Document") {
         /**   
          * If is a Document type Document, the app name is the same as the module name
          */
         this.__APP__ = this.app_name || await loopar.db.getValue("Module", "app_name", this.module);
      } else {
         /**
          * If not is a Document type Document, any document can belong to a certaing app based on the DOCTYPE module
          */
         this.__APP__ = this.app_name || await loopar.db.getValue("Module", "app_name", this.__DOCTYPE__.module);
      }
   }

   async make() {
      this.#makeFields(JSON.parse(this.__DOCTYPE__[this.fieldDocStructure]));


      this.__DOCTYPE__.STRUCTURE = JSON.parse(this.__DOCTYPE__[this.fieldDocStructure]).filter(field => field.data.name !== ID);

      if (this.__DOCUMENT__ && this.__DOCUMENT__[this.fieldDocStructure]) {
         this.__DOCUMENT__[this.fieldDocStructure] = JSON.stringify(JSON.parse(this.__DOCUMENT__[this.fieldDocStructure]).filter(field => (field.data || {}).name !== ID));
      }

      await this.setApp();
      this.onLoad();
   }

   #makeField(field, field_name = field.data.name, value = null) {
      if (!this.#fields[field_name]) {
         this.#fields[field_name] = new DynamicField(field, value || this.__DOCUMENT__[field_name]);

         Object.defineProperty(this, `get_${field_name}`, {
            get: () => {
               return this.#fields[field_name];
            }
         });

         Object.defineProperty(this, field_name, {
            get: () => {
               return this.#fields[field_name].value;
            },
            set: (val) => {
               this.#fields[field_name].value = val;
            }
         });
      }
   }

   #makeFields(fields = this.__DOCTYPE__.STRUCTURE) {
      fields.map(field => {
         if (fieldIsWritable(field)) {
            this.#makeField(field);
         } else if (field.element === "table") {

         }

         this.#makeFields(field.elements || []);
      });
   }

   nameIsNull() {
      return (!this.name || this.name === "undefined") || this.name.length === 0;
   }

   setUniqueName() {
      if (this.nameIsNull() && (this.__IS_NEW__ || this.__DOCTYPE__.is_single) && this.getName.hidden === 1) {
         this.name = loopar.utils.randomString(10);
      }
   }

   async save() {
      const args = arguments[0] || {};

      const validate = args.validate !== false;

      return new Promise(async resolve => {
         this.setUniqueName();
         if (validate) await this.validate();

         if (this.__IS_NEW__ || this.__DOCTYPE__.is_single) {
            await loopar.db.insertRow(this.__DOCTYPE__.name, this.stringifyValues, this.__DOCTYPE__.is_single);
            this.__documentName__ = this.name;
         } else {
            const data = this.valuesToSetDataBase;
            if (Object.keys(data).length) {
               await loopar.db.updateRow(
                  this.__DOCTYPE__.name,
                  data,
                  this.__documentName__,
                  this.__DOCTYPE__.is_single
               );
            }
         }

         const updateChild = async () => {
            const child_values_req = this.childValuesReq;

            if (Object.keys(child_values_req).length) {
               for (const [key, value] of Object.entries(child_values_req)) {
                  await loopar.db.execute(`DELETE FROM \`tbl${key}\` WHERE document_parent = '${this.__DOCTYPE__.name}' AND document_parent_name = '${this.__documentName__}'`)

                  let rows = typeof value === 'string' ? JSON.parse(value) : value;
                  rows = Array.isArray(rows) ? rows : [];

                  for (const row of (rows || [])) {
                     row.document_parent = this.__DOCTYPE__.name;
                     row.document_parent_name = this.__documentName__;

                     const document = await loopar.newDocument(key, row);
                     await document.save();
                  }
               }
            }
         }

         await updateChild();
         await this.updateInstaller();

         const files = this.__DOCUMENT__.req_upload_files || [];
         for (const file of files) {
            const file_manager = await loopar.newDocument("File Manager");
            file_manager.req_upload_file = file;
            await file_manager.save();
         }

         resolve();
      });
   }

   fieldsName() {

   }

   async updateInstaller() {
      const deleteDocument = arguments[0] || false;
      if (loopar.installing) return;

      if (this.__DOCTYPE__.include_in_installer) {
         let data = {};

         if (this.__DOCTYPE__.name === "Document") {
            data = {
               id: this.id,
               name: this.name,
               module: this.module,
            }
         } else {
            data = await this.rawValues();
         }

         await loopar.updateInstaller({
            doctype: this.__DOCTYPE__,
            document: this.__DOCTYPE__.name,
            documentName: this.name,
            appName: this.__APP__,
            record: data,
            deleteRecord: deleteDocument
         });
      }
   }

   async validate() {
      //return new Promise(resolve => {
      const errors = Object.values(this.#fields).filter(field => field.name !== ID).map(e => e.validate()).filter(e => !e.valid).map(e => e.message);
      const selectTypes = await this.validateSelectTypes();
      !loopar.installing && errors.push(...selectTypes);

      errors.length > 0 && loopar.throw({
         error_type: VALIDATION_ERROR,
         message: errors.join('<br/>')
      });
      //});
   }

   async validateSelectTypes() {
      const errors = [];
      for (const field of Object.values(this.#fields)) {
         if (field.element === SELECT && field.options && typeof field.options === 'string') {
            const options = (field.options || "").split("\n");

            if (!field.value || field.value === "") continue;

            if (options.length > 1) {
               if (!options.includes(field.value)) {
                  errors.push(`The value ${field.value} for ${field.name} can only be one of the list of options`);
               }
            } else {
               const err_for_not_valid_document = `The field ${field.name} does not have a valid document configured, please check the document metadata or contact an Administrator.`;

               if (options[0] === "") {
                  errors.push(err_for_not_valid_document);
               } else {
                  if (await loopar.db.count(options[0]) === 0) {
                     errors.push(err_for_not_valid_document);
                  } else {
                     const link = await loopar.db.count(field.options, field.value);

                     if (link === 0) {
                        errors.push(`The value ${field.value} for ${field.name} does not exist in ${field.options} Document`);
                     }
                  }
               }
            }
         }
      }

      return errors;
   }

   async delete() {
      return new Promise(async resolve => {
         try {
            const result = await loopar.db.deleteRow(this.__DOCTYPE__.name, this.__documentName__);

            if (this.updateInstaller && typeof this.updateInstaller === 'function') {
               await this.updateInstaller(true);
            }

            await this.trigger('after_delete', this);
            resolve({
               success: true,
               data: result
            });
         } catch (error) {
            resolve({
               success: false,
               errors: [{ error: error.message }]
            });
         }
      });
   }

   async __data__() {
      return {
         __DOCTYPE__: this.__DOCTYPE__,
         __documentName__: this.__documentName__,
         __DOCUMENT__: await this.values(),
         //__DOCUMENT__: this.__DOCUMENT__,
         __IS_NEW__: this.__IS_NEW__,
      }
   }

   async values() {
      const value = async (field) => {
         if (field.name === this.fieldDocStructure) {
            return field.value ? JSON.stringify(field.value.filter(field => (field.data || []).name !== ID)) : "[]";
         } else if (field.element === FORM_TABLE) {
            return await this.getChildValues(field.options);
         } else if (field.element === PASSWORD) {
            return field.value && field.value.length > 0 ? this.protectedPassword : "";
         } else {
            return field.stringifyValue;
         }
      }

      return Object.values(this.#fields).reduce(async (acc, cur) => {
         return { ...await acc, [cur.name]: await value(cur) }
      }, {});
   }

   async rawValues() {
      return Object.values(this.#fields).reduce(async (acc, cur) => {
         return { ...await acc, [cur.name]: cur.value }
      }, {});
   }

   async getChildValues(field) {
      return await loopar.getList(field, {
         filters: {

            "=": {
               document_parent: this.__DOCTYPE__.name,
            },
            "AND": {
               "=": {
                  document_parent_name: this.__documentName__
               }
            }
         }
      })
   }

   get stringifyValues() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID && field.element !== FORM_TABLE)
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue }), {});
   }

   get valuesToSetDataBase() {
      return Object.values(this.#fields)
         .filter(field => {
            if (field.name === ID) return false;

            if ((this.__IS_NEW__ && field.set_only_time) || field.element === FORM_TABLE) return false;

            if (field.type === PASSWORD) {
               return field.value !== this.protectedPassword;
            }

            return true;
         })
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue }), {});
   }

   get childValuesReq() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID && field.element === FORM_TABLE)
         .reduce((acc, cur) => ({ ...acc, [cur.options]: cur.stringifyValue }), {});
   }

   get formattedValues() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID)
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.formattedValue }), {});
   }
}