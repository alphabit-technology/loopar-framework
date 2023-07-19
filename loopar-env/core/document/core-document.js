'use strict'

import DynamicField from './dynamic-field.js';
import { loopar } from '../loopar.js';

export default class CoreDocument {
   #fields = {};
   document_type = "Document";
   field_doc_structure = 'doc_structure';
   protected_password = "********";

   constructor(props) {
      Object.assign(this, props);

      this.make();
   }

   get fields() {
      return this.#fields;
   }

   on_load() {

   }

   trigger(event, ...args) {
      if (this[event] && typeof this[event] === 'function') {
         this[event](event, ...args);
      }
   }

   async make() {
      this.#make_fields(JSON.parse(this.__DOCTYPE__[this.field_doc_structure]));

      this.__DOCTYPE__.STRUCTURE = JSON.parse(this.__DOCTYPE__[this.field_doc_structure]).filter(field => field.data.name !== ID);

      if (this.__DOCUMENT__ && this.__DOCUMENT__[this.field_doc_structure]) {
         this.__DOCUMENT__[this.field_doc_structure] = JSON.stringify(JSON.parse(this.__DOCUMENT__[this.field_doc_structure]).filter(field => (field.data || {}).name !== ID));
      }

      this.on_load();
   }

   #make_field(field, field_name = field.data.name, value = null) {
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

   #make_fields(fields = this.__DOCTYPE__.STRUCTURE) {
      fields.map(field => {
         if (fieldIsWritable(field)) {
            this.#make_field(field);
         } else if (field.element === "table") {

         }

         this.#make_fields(field.elements || []);
      });
   }

   name_is_null() {
      return (!this.name || this.name === "undefined") || this.name.length === 0;
   }

   set_unique_name() {
      if (this.name_is_null() && (this.__IS_NEW__ || this.__DOCTYPE__.is_single) && this.get_name.hidden === 1) {
         this.name = loopar.utils.random_string(10);
      }
   }

   async save() {
      const args = arguments[0] || {};
      
      const validate = args.validate !== false;

      return new Promise(async resolve => {
         this.set_unique_name();
         if (validate) await this.validate();

         if (this.__IS_NEW__ || this.__DOCTYPE__.is_single) {
            await loopar.db.insert_row(this.__DOCTYPE__.name, this.stringify_values, this.__DOCTYPE__.is_single);
            this.__DOCUMENT_NAME__ = this.name;
         } else {
            const data = this.values_to_set_data_base;
            if (Object.keys(data).length) {
               await loopar.db.update_row(
                  this.__DOCTYPE__.name,
                  data,
                  this.__DOCUMENT_NAME__,
                  this.__DOCTYPE__.is_single
               );
            }
         }

         const update_child = async () => {
            const child_values_req = this.child_values_req;
           

            if (Object.keys(child_values_req).length) {
               for (const [key, value] of Object.entries(child_values_req)) {
                  await loopar.db.execute(`DELETE FROM \`tbl${key}\` WHERE document_parent = '${this.__DOCTYPE__.name}' AND document_parent_name = '${this.__DOCUMENT_NAME__}'`)

                  let rows = typeof value === 'string' ? JSON.parse(value) : value;
                  rows = Array.isArray(rows) ? rows : [];

                  for (const row of (rows || [])) {
                     row.document_parent = this.__DOCTYPE__.name;
                     row.document_parent_name = this.__DOCUMENT_NAME__;

                     const document = await loopar.new_document(key, row);
                     await document.save();
                  }
               }
            }
         }

         await update_child();
         const files = this.__DOCUMENT__.req_upload_files || [];
         for(const file of files){
            const file_manager = await loopar.new_document("File Manager");
            file_manager.req_upload_file = file;
            await file_manager.save();
         }

         resolve();
      });
   }

   async validate() {
      //return new Promise(resolve => {
      const errors = Object.values(this.#fields).filter(field => field.name !== ID).map(e => e.validate()).filter(e => !e.valid).map(e => e.message);
      const select_types = await this.validate_select_types();
      !loopar.installing && errors.push(...select_types);

      errors.length > 0 && loopar.throw({
         error_type: VALIDATION_ERROR,
         message: errors.join('<br/>')
      });
      //});
   }

   async validate_select_types() {
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
            const result = await loopar.db.delete_row(this.__DOCTYPE__.name, this.__DOCUMENT_NAME__);

            if (this.update_installer && typeof this.update_installer === 'function') {
               await this.update_installer(true);
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
         __DOCUMENT_NAME__: this.__DOCUMENT_NAME__,
         __DOCUMENT__: await this.values(),
         //__DOCUMENT__: this.__DOCUMENT__,
         __IS_NEW__: this.__IS_NEW__,
      }
   }

   async values() {
      const value = async (field) => {
         if (field.name === this.field_doc_structure) {
            return field.value ? JSON.stringify(field.value.filter(field => (field.data || []).name !== ID)) : "[]";
         } else if (field.element === FORM_TABLE) {
            return await this.get_child_values(field.options);
         }else if(field.element === PASSWORD){
            return field.value && field.value.length > 0 ? this.protected_password : "";
         }else{
            return field.stringify_value;
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

   async get_child_values(field) {
      return await loopar.get_list(field, {
         filters: {

            "=": {
               document_parent: this.__DOCTYPE__.name,
            },
            "AND": {
               "=": {
                  document_parent_name: this.__DOCUMENT_NAME__
               }
            }
         }
      })
   }

   get stringify_values() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID && field.element !== FORM_TABLE)
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringify_value }), {});
   }

   get values_to_set_data_base() {
      return Object.values(this.#fields)
         .filter(field => {
            if(field.name === ID) return false;

            if((this.__IS_NEW__ && field.set_only_time) || field.element === FORM_TABLE) return false;

            if(field.type === PASSWORD){
               return field.value !== this.protected_password;
            }

            return true;
         })
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringify_value }), {});
   }

   get child_values_req() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID && field.element === FORM_TABLE)
         .reduce((acc, cur) => ({ ...acc, [cur.options]: cur.stringify_value }), {});
   }

   get formatted_values() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID)
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.formatted_value }), {});
   }

   /*static make_filter(filters) {
      const filter = (filters || []).map(filter => {
         const {field, operator, value} = filter;

         return {
            [field]: {
               [operator]: value
            }
         }
      });

      return filter.length > 1 ? {
         "AND": filter
      } : filter[0];
   }*/
}