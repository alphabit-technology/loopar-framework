'use strict'

import CoreDocument from './core-document.js';
import { loopar } from '../loopar.js';
import {Op} from '@sequelize/core';

function combineSequelizeConditions(...conditions) {
  const validConditions = conditions.filter(cond => {
    if (!cond || typeof cond !== 'object' || Array.isArray(cond)) {
      return false;
    }
    
    const hasNormalKeys = Object.keys(cond).length > 0;
    const hasSymbols = Object.getOwnPropertySymbols(cond).length > 0;
    
    return hasNormalKeys || hasSymbols;
  });
  
  if (validConditions.length === 0) return {};
  if (validConditions.length === 1) return validConditions[0];
  
  return { [Op.and]: validConditions };
}


export default class BaseDocument extends CoreDocument {

  constructor(props) {
    super(props);
  }

  validateReservedFieldName(fieldName){
    const restricrtedClass = [BaseDocument, CoreDocument]

    for(const C of restricrtedClass){
      const exist = Object.prototype.hasOwnProperty.call(this, fieldName);

      if(exist){
        console.log([fieldName, exist])
      }
    }
  }

  validateFieldNameLikeMethod(fieldName){
    const checkIfFieldExistLikeAttribute = Object.getOwnPropertyDescriptor(this, fieldName);
    if (checkIfFieldExistLikeAttribute) {
      loopar.throw(`
        The field name ${fieldName} is already used as attribute of the ${this.__ENTITY__.name} document
        please change the name of the field in the doc_structure of the ${this.__ENTITY__.name} Entity,
        or rename the attribute in the ${this.__ENTITY__.name} class.
      `);
    }
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
 * @queryFormat
 * {
      AND: {
        "=": { type: "user" },
        OR: {
          "IN": { id: [1,2,3] },
          "LIKE": [ ["first_name","last_name"], "smith" ]
        },
        "BETWEEN": { created_at: ["2024-01-01","2024-12-31"] }
      }
    }

  */
  buildCondition(q = null){
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

    const conditions = [];

    Object.entries(q).forEach(([key, value]) => {
      const field = this.fields[key];
      
      if (!field) return;

      if (value && value.toString().length > 0) {
        const isSelectType = [SELECT, SWITCH, CHECKBOX].includes(field.element);
        
        if ([SWITCH, CHECKBOX].includes(field.element)) {
          if ([1, '1'].includes(value)) {
            conditions.push({ [key]: 1 });
          }
        } else if (isSelectType) {
          conditions.push({ [key]: value });
        } else {
          conditions.push({ [key]: { [Op.like]: `%${value}%` } });
        }
      }
    });

    if (conditions.length === 0) return {};
    if (conditions.length === 1) return conditions[0];

    return { [Op.and]: conditions };
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

    const condition = combineSequelizeConditions(this.buildCondition(q), filters);
    
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

  async getListToForm({ fields = null, filters = {}, q = null, rowsOnly = false } = {}) {
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

    if (this.__ENTITY__.name === 'Entity') {
      listFields.push('is_single');
    }

    const condition = combineSequelizeConditions(this.buildCondition(q), filters);

    pagination.totalRecords = await this.records(condition);

    pagination.totalPages = Math.ceil(pagination.totalRecords / pagination.pageSize);
    //const selfPagination = JSON.parse(JSON.stringify(pagination));
    loopar.db.pagination = pagination;
    const rows = await loopar.db.getList(this.__ENTITY__.name, [...listFields, "id"], condition);

    if (rows.length === 0 && pagination.page > 1) {
      await loopar.session.set(this.__ENTITY__.name + "_page", 1);
      return await this.getList({ fields, filters, q, rowsOnly });
    }

    return rows;

    /*return {
      rows: rows,
      //pagination: selfPagination,
      //q,
    };*/
  }

  buildConditionToSelect(q = null) {
    if (q === null) return {};
    if (q === '') return {};
    
    if (this.getFieldSelectNames().length === 1) {
      return { [this.getFieldSelectNames()]: { [Op.like]: `%${q}%` } };
    }
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