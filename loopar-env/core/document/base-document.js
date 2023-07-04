'use strict'

import CoreDocument from './core-document.js';
import {loopar} from '../loopar.js';
import {lowercase} from '../helper.js';

export default class BaseDocument extends CoreDocument {
   constructor(props) {
      super(props);
   }

   get_field_properties(field_name) {
      const fields = Object.values(this.fields)
         .filter(k => k.name !== "__DOCTYPE__" && k.in_list_view).map(k => k[field_name]).filter(k => lowercase(k) !== 'id');

      return fields.length === 0 ? ['name'] : fields;
   }

   get_field_list_names() {
      const fields = this.get_field_properties('name');

      return fields.length === 0 ? ['name'] : fields;
   }

   get_field_list_labels() {
      const labels = this.get_field_properties('label');

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
    *    '=': {name: "Document"},
    *    AND: {
    *       '=': {module: "Core"
    *       AND: {
    *          '=': {is_single: 1},
    *          AND: {
    *             '=': {is_static: 0},
    *          }
    *       }
    *    },
    * }
    */
   build_condition(q = null) {
      if (q === null) return {};

      return Object.entries(q).reduce((acc, [key, value], index) => {
         const field = this.fields[key];
         if (!field) return acc;

         const operand = [SELECT,SWITCH,CHECKBOX].includes(field.element) ? '=' : 'LIKE';

         const set_condition = (where) => {
            if (value && value.length > 0) {
               if([SWITCH, CHECKBOX].includes(field.element)){
                  if([1, '1'].includes(value)) where[operand] = {[key]: value}
               }else {
                  where[operand] = {[key]: value};
               }
            }
         }

         if (index === 0) {
            set_condition(acc);
            if (Object.keys(q).length > 1) acc['AND'] = {};

            return acc;
         }

         let current = acc['AND'];
         while (Object.keys(current).length > 0) {
            current = current['AND'];
         }

         set_condition(current);

         if (index < Object.keys(q).length - 1) current['AND'] = {};

         return acc;
      }, {});
   }

   async get_list({fields = null, filters = {}, q = null} = {}) {
      if(this.__DOCTYPE__.is_single) {
         return loopar.throw({
            code: 404,
            message: "This document is single, you can't get list"
         });
      }
      
      this.pagination = {
         page: loopar.session.get(current_controller.document + "_page") || 1,
         page_size: 10,
         total_pages: 4,
         total_records: 1,
         sort_by: "id",
         sort_order: "asc"
      };

      const list_fields = fields || this.get_field_list_names();
      //TODO: add filters on document is virtual deleted
      const filter_if_is_deleted = {};//{'<>': {'is_deleted': 1}};

      if (this.__DOCTYPE__.name === 'Document' && current_controller.document !== "Document") {
         list_fields.push('is_single');
      }

      const condition = this.build_condition(q);
      this.pagination.total_records = await this.records(condition);

      this.pagination.total_pages = Math.ceil(this.pagination.total_records / this.pagination.page_size);
      loopar.db.pagination = this.pagination;

      const rows = await loopar.db.get_list(this.__DOCTYPE__.name, list_fields, {...condition, ...filters, ...filter_if_is_deleted});

      if(rows.length === 0 && this.pagination.page > 1){
         await loopar.session.set(this.__DOCTYPE__.name + "_page", 1);
         return await this.get_list({fields, filters, q});
      }

      return Object.assign(await this.__data__(), {
         labels: this.get_field_list_labels(),
         fields: list_fields,
         rows: rows,
         pagination: this.pagination,
         q
      });
   }

   build_condition_to_select(q = null) {
      return {'LIKE': {'CONCAT': this.get_field_select_names(), value: `%${q}%`}};
   }

   get_field_select_names() {
      return Array.from(new Set([...this.__DOCTYPE__.search_fields.split(',').filter(field => field !== ''), 'name']));
   }

   get_field_select_labels() {
      return Array.from(new Set([...this.__DOCTYPE__.title_fields.split(',').filter(field => field !== ''), 'name']));
   }

   async get_list_to_select_element(q = null) {
      this.pagination = {
         page: 1,
         page_size: 20,
         total_pages: 4,
         total_records: 1,
         sort_by: "id",
         sort_order: "asc"
      };

      loopar.db.pagination = this.pagination;

      const list_fields = this.get_field_select_labels();

      const rows = await loopar.db.get_list(this.__DOCTYPE__.name, list_fields, this.build_condition_to_select(q));

      this.pagination.total_records = await this.records();
      this.pagination.total_pages = Math.ceil(this.pagination.total_records / this.pagination.page_size);

      return Object.assign({
         title_fields: list_fields,
         rows: rows
      });
   }

   async records(condition = null) {
      return await loopar.db._count(this.__DOCTYPE__.name, {}, condition);
   }
}