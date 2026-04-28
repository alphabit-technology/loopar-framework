'use strict';
import { loopar, parseDocument } from "loopar";
import { Sequelize, Op } from '@sequelize/core';
import EventEmitter from "events";
import Connector from "./core/sequelize/connector.js";
import { safeDefaultForType } from "./core/sequelize/core.js";

function whereToSqlString(sequelize, whereObj, model = null) {
  try {
    const queryGenerator = sequelize.queryInterface.queryGenerator;
    const options        = model ? { model } : {};
    return queryGenerator.whereItemsQuery(whereObj, options);
  } catch (error) {
    console.error(["Error generating SQL WHERE clause:", error, whereObj]);
    return null;
  }
}

export class SequelizeORM extends Connector {
  tablePrefix = 'tbl';
  transaction = null;
  transactionActive = false;
  executionTimeInsertedIds = {};

  static _bus = new EventEmitter();
  static _pipeline = new Map();

  static on(event, handler) {
    if (event.startsWith("before")) {
      const handlers = SequelizeORM._pipeline.get(event) || [];
      handlers.push(handler);
      SequelizeORM._pipeline.set(event, handlers);
    } else {
      SequelizeORM._bus.on(event, handler);
    }
  }

  static off(event, handler) {
    if (event.startsWith("before")) {
      const handlers = SequelizeORM._pipeline.get(event) || [];
      SequelizeORM._pipeline.set(event, handlers.filter(h => h !== handler));
    } else {
      SequelizeORM._bus.off(event, handler);
    }
  }

  static once(event, handler) {
    if (event.startsWith("before_")) {
      const wrapper = async (payload) => {
        await handler(payload);
        SequelizeORM.off(event, wrapper);
      };
      SequelizeORM.on(event, wrapper);
    } else {
      SequelizeORM._bus.once(event, handler);
    }
  }

  async #emitBefore(event, payload) {
    const document = payload?.document;
    const events = [event, document ? `${event}:${document}` : null].filter(Boolean);

    for (const ev of events) {
      const handlers = SequelizeORM._pipeline.get(ev) || [];
      for (const handler of handlers) {
        await handler(payload);
      }
    }
  }

  #emitAfter(event, payload) {
    const document = payload?.document;
    SequelizeORM._bus.emit(event, payload);
    if (document) SequelizeORM._bus.emit(`${event}:${document}`, payload);
  }

  dbFielTypeCanHaveDefaultValue(fieldType) {
    return [
      'varchar', 'text', 'int', 'bigint', 'tinyint', 'smallint',
      'mediumint', 'float', 'double', 'decimal',
      'date', 'datetime', 'timestamp', 'time', 'year',
    ].includes(fieldType);
  }

  isValidDefaultValue(value, type) {
    if (value === null) return true;
    switch (type) {
      case 'int': case 'bigint': case 'tinyint': case 'smallint':
      case 'mediumint': case 'float': case 'double': case 'decimal':
        return !isNaN(value);
      case 'date': case 'datetime': case 'timestamp': case 'time': case 'year':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  async WHERE(__CONDITIONS__ = null) {
    return whereToSqlString(this.sequelize, __CONDITIONS__) || '';
  }

  makePagination() {
    return this.pagination || {
      page: 1, pageSize: 5, totalPages: 4,
      totalRecords: 1, sortBy: "id", sortOrder: "asc",
    };
  }

  setPage(page) {
    if (this.pagination) {
      this.pagination.page = page;
    } else {
      this.pagination = { ...this.makePagination(), page };
    }
  }

  getParseData(data) {
    const STRING_LITERAL_MAP = { null: null, undefined: null, true: true, false: false };
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (value === undefined) { acc[key] = null; return acc; }
      if (value !== null && typeof value === 'object') { acc[key] = JSON.stringify(value); return acc; }
      if (typeof value === 'string' && Object.prototype.hasOwnProperty.call(STRING_LITERAL_MAP, value)) {
        acc[key] = STRING_LITERAL_MAP[value];
        return acc;
      }
      acc[key] = value;
      return acc;
    }, {});
  }

  /**
   * Pad `data` with a type-safe value for every DB column absent from the payload.
   *
   * Priority per column:
   *   1. Has DB-level DEFAULT → use it
   *   2. nullable → null
   *   3. NOT NULL, no default → safeDefaultForType() → 0 or ''
   *
   * This is the runtime safety net for orphan columns on SQLite where
   * ALTER COLUMN is not supported and NOT NULL cannot be removed via DDL.
   *
   * @param {string} document - LOGICAL document name (e.g. "Role")
   * @param {object} data - already-parsed data payload
   */
  async #padOrphanColumns(document, data) {
    const colMap  = await this.getTableColumns(document);
    const dataKeys = new Set(Object.keys(data).map(k => k.toLowerCase()));

    for (const [colLower, meta] of colMap) {
      if (dataKeys.has(colLower)) continue;

      if (meta.default !== null && meta.default !== undefined) {
        data[meta.name] = meta.default;
      } else if (meta.nullable) {
        data[meta.name] = null;
      } else {
        data[meta.name] = safeDefaultForType(meta.type);
      }
    }

    return data;
  }

  async insertRow(document, data = {}, isSingle = false) {
    data = this.getParseData(data);

    if (!isSingle) {
      data = await this.#padOrphanColumns(document, data);
    }

    await this.#emitBefore("beforeCreate", { document, doc: data });

    const quote = (field) =>
      this.dialect.includes('mysql') ? `\`${field}\`` : `"${field}"`;

    if (isSingle) {
      const rows = Object.keys(data).map(field => ({
        name: `${document}-${field}`,
        document,
        field,
        value: data[field] ?? null,
        __document_status__: 'Active',
      }));

      for (const row of rows) {
        const fields = Object.keys(row);
        const placeholders = fields.map(() => '?').join(', ');
        const values = Object.values(row);
        const quotedFields = fields.map(quote).join(', ');
        const tableName = this.tableName('Document Single Values');

        let query;
        if (this.dialect.includes('mysql')) {
          const updateClause = fields
            .filter(f => f !== 'name')
            .map(f => `${quote(f)} = VALUES(${quote(f)})`)
            .join(', ');
          query = `INSERT INTO ${tableName} (${quotedFields}) VALUES (${placeholders})
                   ON DUPLICATE KEY UPDATE ${updateClause}`;
        } else {
          query = `INSERT OR REPLACE INTO ${tableName} (${quotedFields}) VALUES (${placeholders})`;
        }

        await this.sequelize.query(query, {
          replacements: values,
          type: Sequelize.QueryTypes.INSERT,
          transaction: this.transaction,
        });
      }
    } else {
      const nextId = parseInt(await this.nextId(document)) || 1;
      const currentId = parseInt(data.id) || 0;
      data.id = currentId && currentId >= nextId ? currentId : nextId;

      const fields = Object.keys(data);
      const placeholders = fields.map(() => '?').join(', ');
      const values = Object.values(data);
      const quotedFields = fields.map(quote).join(', ');
      const query = `INSERT INTO ${this.tableName(document)} (${quotedFields}) VALUES (${placeholders})`;

      await this.sequelize.query(query, {
        replacements: values,
        type: Sequelize.QueryTypes.INSERT,
        transaction: this.transaction,
      });
    }

    this.#emitAfter("afterCreate", { document, doc: data });
  }

  async maxId(document) {
    const result = await this.sequelize.query(
      `SELECT MAX(id) as max FROM ${this.tableName(document)}`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    return result[0]?.max || 0;
  }

  async nextId(document) {
    const maxId   = await this.maxId(document);
    const tracked = this.executionTimeInsertedIds[document] || 0;
    this.executionTimeInsertedIds[document] = Math.max(maxId, tracked) + 1;
    return this.executionTimeInsertedIds[document];
  }

  async setValue(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    return await this.#setValueTo(document, field, value, name, { distinctToId, ifNotFound });
  }

  async #setValueTo(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    const condition = typeof name === 'object' ? { ...name } : { name };
    if (distinctToId) condition[Op.and] = [condition, { id: { [Op.ne]: distinctToId } }];

    const where = await this.WHERE(condition);
    const query = `UPDATE ${this.tableName(document)} SET ${this.escapeId(field)} = ? WHERE ${where}`;

    await this.sequelize.query(query, {
      replacements: [value],
      type: Sequelize.QueryTypes.UPDATE,
      transaction: this.transaction,
    });
  }

  literalTableName(document) {
    return this.tableName(document).replace(/`/g, "").replace(/"/g, "");
  }

  async updateRow(document, name, data = {}) {
    data = this.getParseData(data);
    delete data.id;

    await this.#emitBefore("beforeUpdate", { document, doc: data});

    const fields = Object.keys(data);
    const setClause = fields.map(field => `${this.escapeId(field)} = ?`).join(', ');
    const values = [...Object.values(data), name];
    const query = `UPDATE ${this.tableName(document)} SET ${setClause} WHERE name = ?`;

    await this.sequelize.query(query, {
      replacements: values,
      type: Sequelize.QueryTypes.UPDATE,
      transaction: this.transaction,
    });

    this.#emitAfter("afterUpdate", { document, doc: {data} });
  }

  async deleteRow(document, name, softDelete = true) {
    await this.#emitBefore("beforeDelete", { document, doc:{name} });

    /* if (softDelete) {
      await this.updateRow(document, { __document_status__: 'Deleted' }, name);
      this.#emitAfter("afterDelete", { document, name });
      return;
    } */

    await this.sequelize.query(
      `DELETE FROM ${this.tableName(document)} WHERE name = ?`,
      { replacements: [name], type: Sequelize.QueryTypes.DELETE, transaction: this.transaction }
    );

    this.#emitAfter("afterDelete", {document, doc: { name }});
  }

  async deleteWhere(document, condition) {
    const doc = await this.getRow(document, condition);
    await this.#emitBefore("beforeDelete", { document, doc });
    const where = await this.WHERE(condition);
    const whereCond = where ? `WHERE ${where}` : '';
    
    if (!whereCond) {
      throw new Error('[deleteWhere] condition is required — refusing to delete all rows');
    }

    await this.sequelize.query(
      `DELETE FROM ${this.tableName(document)} ${whereCond}`,
      { type: Sequelize.QueryTypes.RAW, transaction: this.transaction }
    );

    this.#emitAfter("afterDelete", { document, doc});
  }

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.escape(table) : this.escapeId(table);
  }

  async getValue(document, field, name, { distinctToId = null, ifNotFound = "throw", includeDeleted = false } = {}) {
    try {
      const condition = typeof name === 'object' ? { ...name } : name ? { name } : {};
      if (distinctToId) condition['id'] = { [Op.ne]: distinctToId };
      const result = await this.getDoc(document, condition, [field], { includeDeleted });
      if (!result) return null;
      return typeof field === 'object' ? result : result[field];
    } catch (e) {
      if (ifNotFound === "throw") throw e;
      return ifNotFound;
    }
  }

  async getParseDoc() {
    return parseDocument(arguments[0], await this.getDoc(...arguments));
  }

  async getDoc(document, name, fields = ['*'], { includeDeleted = false } = {}) {
    const ref = typeof document === 'object' ? document.__REF__ : loopar.getRef(document);
    document  = typeof document === 'object' ? document.name : document;
    document  = document === "Document" ? "Entity" : document;

    fields = fields[0] === '*'
      ? ref.__FIELDS__
      : fields.filter(field => ref.__FIELDS__.includes(field));

    return await this.getRow(document, name, fields, { isSingle: ref.is_single, includeDeleted });
  }

  async getRow(table, id, fields = ['*'], { isSingle = false, includeDeleted = false } = {}) {
    this.setPage(1);
    const condition = id ? (typeof id === 'object' ? id : { name: id }) : {};
    const rows = await this.getList(table, fields, condition, { isSingle, includeDeleted });
    return rows.length ? rows[0] : null;
  }

  async getDocEAV(document, fields = ['*'], condition = null, { includeDeleted = false } = {}) {
    const replacements     = [document];
    const filterConditions = [];

    if (condition && Object.keys(condition).length > 0) {
      for (const [fieldName, fieldValue] of Object.entries(condition)) {
        if (fieldName === '__document_status__') continue;

        if (fieldValue !== null && typeof fieldValue === 'object') {
          const operator = Object.keys(fieldValue)[0];
          const value    = fieldValue[operator];
          const subBase  = `
            EXISTS (
              SELECT 1 FROM ${this.tableName('Document Single Values')} sub
              WHERE sub.document = main.document AND sub.field = ?`;

          switch (operator) {
            case Op.ne:
              filterConditions.push(subBase + ' AND sub.value != ?)');
              replacements.push(fieldName, value);
              break;
            case Op.like:
              filterConditions.push(subBase + ' AND sub.value LIKE ?)');
              replacements.push(fieldName, value);
              break;
            case Op.in: {
              const ph = value.map(() => '?').join(',');
              filterConditions.push(subBase + ` AND sub.value IN (${ph}))`);
              replacements.push(fieldName, ...value);
              break;
            }
            default:
              filterConditions.push(subBase + ' AND sub.value = ?)');
              replacements.push(fieldName, value);
          }
        } else {
          filterConditions.push(`
            EXISTS (
              SELECT 1 FROM ${this.tableName('Document Single Values')} sub
              WHERE sub.document = main.document AND sub.field = ? AND sub.value = ?
            )`);
          replacements.push(fieldName, fieldValue);
        }
      }
    }

    if (!includeDeleted) {
      filterConditions.push(`
        NOT EXISTS (
          SELECT 1 FROM ${this.tableName('Document Single Values')} sub
          WHERE sub.document = main.document AND sub.field = ? AND sub.value = ?
        )`);
      replacements.push('__document_status__', 'Deleted');
    }

    let whereClause = 'document = ?';
    if (filterConditions.length) whereClause += ' AND ' + filterConditions.join(' AND ');
    if (fields[0] !== '*') {
      whereClause += ` AND field IN (${fields.map(() => '?').join(',')})`;
      replacements.push(...fields);
    }

    const rows = await this.sequelize.query(
      `SELECT field, value FROM ${this.tableName('Document Single Values')} main WHERE ${whereClause}`,
      { replacements, type: Sequelize.QueryTypes.SELECT }
    );

    const reconstructed = rows.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {});

    if (fields[0] !== '*') {
      const result = {};
      fields.forEach(f => { result[f] = reconstructed[f] !== undefined ? reconstructed[f] : null; });
      return [result];
    }

    return [reconstructed];
  }

  constructParams(params){

  }

  #getParams(...args){
    let document, fields = ['*'], filter = {}, options = {};
  
    if (args.length === 1 && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      ({ document, fields = ['*'], filter = {}, options = {} } = args[0]);
    } else if (
      args.length === 2 &&
      typeof args[0] === 'string' &&
      typeof args[1] === 'object' &&
      !Array.isArray(args[1])
    ) {
      document = args[0];
      const opt = args[1];
  
      fields = opt.fields || ['*'];
      filter = opt.filter || {};
      options = opt.options || {};
    }else {
      [document, fields = ['*'], filter = {}, options = {}] = args;
    }
    
    if (!Array.isArray(fields)) {
      fields = ['*'];
    }

    return {document, fields, filter, options}
  }

  async getList(...args) {
    const {document, fields, filter, options} = this.#getParams(...args);
    
    const {
      isSingle = false,
      all = false,
      includeDeleted = false
    } = options;
  
    if (isSingle) {
      return await this.getDocEAV(document, fields, filter, { includeDeleted });
    }
  
    const whereCondition = await this.WHERE(filter || {});
    const whereCond = whereCondition ? `WHERE ${whereCondition}` : '';
    const fieldList = fields.join(', ');
  
    if (all) {
      return await this.sequelize.query(
        `SELECT ${fieldList} FROM ${this.tableName(document)} ${whereCond}`,
        { type: Sequelize.QueryTypes.SELECT }
      );
    }
  
    const { page, pageSize } = this.makePagination();
    const offset = (page - 1) * pageSize;
  
    return await this.sequelize.query(
      `SELECT ${fieldList} FROM ${this.tableName(document)} ${whereCond} LIMIT ? OFFSET ?`,
      {
        replacements: [pageSize, offset],
        type: Sequelize.QueryTypes.SELECT
      }
    );
  }

  async getAll(...args) {
    const {document, fields, filter, options} = this.#getParams(...args)

    return await this.getList(document, fields, filter, { ...options, all: true });
  }

  async makeFields(fields = ['*']) {
    return fields.map(f => f === '*' ? f : this.escapeId(f)).join(', ');
  }

  async hasEntity(constructor, document) {
    if (!constructor) {
      const ref = loopar.getRef(document);
      constructor = ref?.__REF__?.name || "Entity";
    }
    return (await this.count(constructor, { name: document })) > 0;
  }

  async count(document, condition) {
    if (!condition) return 0;
    document  = document === "Document" ? "Entity" : document;
    condition = typeof condition === 'object' ? condition : { name: condition };

    const where  = await this.WHERE(condition);
    const table  = this.tableName(document);
    const result = await this.sequelize.query(
      `SELECT COUNT(id) as count FROM ${table}${where ? ` WHERE ${where}` : ''}`,
      { type: Sequelize.QueryTypes.SELECT }
    );
    return result[0]?.count || 0;
  }

  async rawQuery(sql, replacements = [], type = Sequelize.QueryTypes.SELECT) {
    const results = await this.sequelize.query(sql, {
      replacements,
      type
    });
    return results;
  }
}

SequelizeORM.on("afterCreate", ({ document }) => loopar.emit(`${document}.changed`));
SequelizeORM.on("afterUpdate", ({ document }) => loopar.emit(`${document}.changed`));
SequelizeORM.on("afterDelete", ({ document }) => loopar.emit(`${document}.changed`));