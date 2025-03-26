'use strict'

import CoreDocument from './core-document.js';
import { loopar } from '../loopar.js';

export default class BaseDocument extends CoreDocument {
  constructor(props) {
    super(props);
  }

  getFieldProperties(field_name) {
    const fields = Object.values(this.fields)
      .filter(k => k.name !== "__ENTITY__" && k.in_list_view).map(k => k[field_name]);

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
      if (!this.fields[field] || value === '') delete q[field];
    });

    const con = Object.entries(q).reduce((acc, [key, value], index) => {
      const field = this.fields[key];
      if (!field) return acc;

      const operand = [SELECT, SWITCH, CHECKBOX].includes(field.element) ? '=' : 'LIKE';
      acc[operand] ??= {};

      if (value && value.length > 0) {
        if ([SWITCH, CHECKBOX].includes(field.element)) {
          if ([1, '1'].includes(value)) {
            acc[operand][key] = 1;
          }
        } else {
          acc[operand][key] = value;
        }
      }

      return acc;
    }, {});

    //console.log(["buildCondition..", con]);

    return Object.entries(con).reduce((acc, [key, value], index) => {
      if (index === 0) {

        /**
         * Firs condition don't need AND
         */
        acc = {
          ...acc,
          ...{ [key]: value }
        }
      } else {
        /**
         * Other conditions need AND
         */
        acc['AND'] = {
          ...acc['AND'],
          ...{ [key]: value }
        };
      }

      return acc;
    }, {});
  }

  async getList({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
    if (this.__ENTITY__.is_single) {
      return loopar.throw({
        code: 404,
        message: "This document is single, you can't get list"
      });
    }

    const pagination = {
      page: loopar.session.get(this.__ENTITY__.name + "_page") || 1,
      pageSize: 10,
      totalPages: 4,
      totalRecords: 1,
      sortBy: "id",
      sortOrder: "asc",
      __ENTITY__: this.__ENTITY__.name
    };

    const listFields = fields || this.getFieldListNames();
    /*if (this.__ENTITY__.name === 'Document' && currentController.document !== "Document") {
       listFields.push('is_single');
    }*/

    if (this.__ENTITY__.name === 'Entity') {
      listFields.push('is_single');
    }

    const condition = { ...this.buildCondition(q), ...filters };
    
    pagination.totalRecords = await this.records(condition);

    pagination.totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);
    const selfPagination = JSON.parse(JSON.stringify(pagination));
    loopar.db.pagination = pagination;

    const rows = await loopar.db.getList(this.__ENTITY__.name, [...listFields, "id"], condition);

    if (rows.length === 0 && pagination.page > 1) {
      await loopar.session.set(this.__ENTITY__.name + "_page", 1);
      return await this.getList({ fields, filters, q, rowsOnly });
    }

    return Object.assign((rowsOnly ? {} : await this.__data__()), {
      labels: this.getFieldListLabels(),
      fields: listFields,
      rows: rows,
      pagination: selfPagination,
      q
    });
  }

  buildConditionToSelect(q = null) {
    return { 'LIKE': [this.getFieldSelectNames(), `%${q}%`] };
  }

  titleFields() {
    return this.__ENTITY__?.title_fields || 'name';
  }

  getSearchedFields() {
    return this.__ENTITY__?.search_fields || 'name';
  }

  getFieldSelectNames() {
    return Array.from(new Set([...this.getSearchedFields().split(',').filter(field => field !== ''), 'name']));
  }

  getFieldSelectLabels() {
    const fields = this.titleFields();
    return Array.from(new Set([...fields.split(',').filter(field => field !== '')]));
  }

  async getListToSelectElement(q = null) {
    const pagination = {
      page: 1,
      pageSize: 20,
      totalPages: 4,
      totalRecords: 1,
      sortBy: "id",
      sortOrder: "asc"
    };

    loopar.db.pagination = pagination;

    const listFields = this.getFieldSelectLabels();

    const rows = await loopar.db.getList(this.__ENTITY__.name, ["name", ...listFields], this.buildConditionToSelect(q));

    
    pagination.totalRecords = await this.records();
    pagination.totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);

    return Object.assign({
      title_fields: listFields,
      rows: rows
    });
  }

  async getValueDescriptive(name) {
    const listFields = this.getFieldSelectLabels();
    const values = await loopar.db.getRow(this.__ENTITY__.name, name, listFields);

    return Object.values(values).map(value => value).join(" - ");
  }

  async records(condition = []) {
    return await loopar.db.count(this.__ENTITY__.name, condition);
  }
}