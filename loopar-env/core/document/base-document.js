'use strict'

import CoreDocument from './core-document.js';
import {loopar} from '../loopar.js';

export default class BaseDocument extends CoreDocument {
   constructor(props) {
      super(props);
   }

   getFieldProperties(field_name) {
      const fields = Object.values(this.fields)
         .filter(k => k.name !== "__DOCTYPE__" && k.in_list_view).map(k => k[field_name]).filter(k => loopar.utils.lowercase(k) !== ID);

      return fields.length === 0 ? ['name'] : fields;
   }

   getFieldListNames() {
      const fields = this.getFieldProperties('name');

      return fields.length === 0 ? ['name'] : fields;
   }

   getFieldListLabels() {
      const labels = this.getFieldProperties('label');

      return labels.length === 0 ? ['Name'] : labels;
   }

   /**
    * Build condition to get list
    * @param q
    * {
    *    name: "Document",
    *    module: "Core",
    *    is_single: 1,
    *    is_static: 0,
    * }
    * @returns
    * {
    *    '=': {
    *       name: "Document",
    *       module: "Core",
    *       is_single: 1,
    *       is_static: 0,
    *    },
    * }
    */
   buildCondition(q = null) {
   
      /**
       * If q is null, return empty object
       */
      if (q === null) return {};

      /**
       * Debug q for empty values and not existing fields
       */
      Object.entries(q).forEach(([field, value]) => {
         if(!this.fields[field] || value === '') delete q[field];
      });

      const con = Object.entries(q).reduce((acc, [key, value], index) => {
         const field = this.fields[key];
         if (!field) return acc;

         const operand = [SELECT,SWITCH,CHECKBOX].includes(field.element) ? '=' : 'LIKE';
         acc[operand] ??= {};

         if (value && value.length > 0) {
            if([SWITCH, CHECKBOX].includes(field.element)){
               if ([1, '1'].includes(value)) {
                  acc[operand][key] = 1;
               }
            }else {
               acc[operand][key] = value;
            }
         }

         return acc;
      }, {});

      return Object.entries(con).reduce((acc, [key, value], index) => {
         if(index === 0){
            /**
             * Firs condition don't need AND
             */
            acc = {
               ...acc,
               ...{[key]: value}
            }
         }else{
            /**
             * Other conditions need AND
             */
            acc['AND'] = {
               ...acc['AND'],
               ...{[key]: value}
            };
         }

         return acc;
      }, {});
   }

   async getList({fields = null, filters = {}, q = null} = {}) {
      if(this.__DOCTYPE__.is_single) {
         return loopar.throw({
            code: 404,
            message: "This document is single, you can't get list"
         });
      }
      
      this.pagination = {
         page: loopar.session.get(this.__DOCTYPE__.name + "_page") || 1,
         pageSize: 10,
         totalPages: 4,
         totalRecords: 1,
         sortBy: "id",
         sortOrder: "asc"
      };
      

      const listFields = fields || this.getFieldListNames();
      /*if (this.__DOCTYPE__.name === 'Document' && currentController.document !== "Document") {
         listFields.push('is_single');
      }*/

      if (this.__DOCTYPE__.name === 'Document') {
         listFields.push('is_single');
      }

      const condition = { ...this.buildCondition(q), ...filters};

      this.pagination.totalRecords = await this.records(condition);

      this.pagination.totalPages = Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);
      loopar.db.pagination = this.pagination;

      const rows = await loopar.db.getList(this.__DOCTYPE__.name, listFields, condition);

      if(rows.length === 0 && this.pagination.page > 1){
         await loopar.session.set(this.__DOCTYPE__.name + "_page", 1);
         return await this.getList({fields, filters, q});
      }

      return Object.assign(await this.__data__(), {
         labels: this.getFieldListLabels(),
         fields: listFields,
         rows: rows,
         pagination: this.pagination,
         q
      });
   }

   buildConditionToSelect(q = null) {
      return {'LIKE': [this.getFieldSelectNames(), `%${q}%`]};
   }

   getFieldSelectNames() {
      return Array.from(new Set([...this.__DOCTYPE__.search_fields.split(',').filter(field => field !== ''), 'name']));
   }

   getFieldSelectLabels() {
      return Array.from(new Set([...this.__DOCTYPE__.title_fields.split(',').filter(field => field !== ''), 'name']));
   }

   async getListToSelectElement(q = null) {
      this.pagination = {
         page: 1,
         pageSize: 20,
         totalPages: 4,
         totalRecords: 1,
         sortBy: "id",
         sortOrder: "asc"
      };

      loopar.db.pagination = this.pagination;

      const listFields = this.getFieldSelectLabels();

      const rows = await loopar.db.getList(this.__DOCTYPE__.name, listFields, this.buildConditionToSelect(q));

      this.pagination.totalRecords = await this.records();
      this.pagination.totalPages = Math.ceil(this.pagination.totalRecords / this.pagination.pageSize);

      return Object.assign({
         title_fields: listFields,
         rows: rows
      });
   }

   async records(condition = null) {
      return await loopar.db._count(this.__DOCTYPE__.name, {}, condition);
   }
}