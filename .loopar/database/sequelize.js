'use strict';

import mysql from 'mysql';
import { loopar } from "../core/loopar.js";
import { Sequelize, QueryTypes, Model, sql } from '@sequelize/core';
import { DataTypes } from '@sequelize/core';
//import pug from "pug";
global.DataTypes = DataTypes;

//console.log(["DataTypes", DataTypes]);
//const fields = ['name', 'document', 'field', 'value'];

class SingleModel extends Model {}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'path/to/database.sqlite'
});

SingleModel.init({
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  document: {
    type: DataTypes.STRING,
    allowNull: false
  },
  field: {
    type: DataTypes.STRING,
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    allowNull: true
  },
  __document_status__: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  sequelize,
  modelName: 'tblDocument Single Values'
});

export default class DataBase {
  #connection = null;
  tablePrefix = 'tbl';
  transaction = false;
  transactions = [];

  constructor() { }

  get dbConfig() {
    return env.dbConfig;
  }

  get database() {
    return this.dbConfig.database;
  }

  async initialize() {
    /*this.pool  = mysql.createPool(
       this.dbConfig
    );

    this.pool.end();

    this.pool.on('connection', function (connection) {
       connection.on('error', function (err) {
          console.error(new Date(), 'MySQL error', err.code);
       });
       connection.on('close', function (err) {
          console.error(new Date(), 'MySQL close', err);
       });
    });*/
    ``

    this.sequelize = sequelize; 
  }

  dbFielTypeCanHaveDefaultValue(fieldType) {
    return ['varchar', 'text', 'int', 'bigint', 'tinyint', 'smallint', 'mediumint', 'float', 'double', 'decimal', 'date', 'datetime', 'timestamp', 'time', 'year'].includes(fieldType);
  }

  isValidDefaultValue(value, type) {
    if (value === null) return true;

    switch (type) {
      case 'int':
      case 'bigint':
      case 'tinyint':
      case 'smallint':
      case 'mediumint':
        return !isNaN(value);
      case 'float':
      case 'double':
      case 'decimal':
        return !isNaN(value);
      case 'date':
      case 'datetime':
      case 'timestamp':
      case 'time':
      case 'year':
        return !isNaN(Date.parse(value));
      default:
        return true;
    }
  }

  datatype(field) {
    const UNIQUE = [field.data.unique ? 'NOT NULL UNIQUE' : ''];

    const type = field.element === INPUT ? field.data.format : field.element;
    const dbType = (ELEMENT_DEFINITION(type, INPUT).type || [])[0];
    const hasDefault = field.data.default_value && this.dbFielTypeCanHaveDefaultValue((ELEMENT_DEFINITION(type, INPUT).type || [])[0]) && this.isValidDefaultValue(field.data.default_value, dbType);

    let defaultValue = field.data.default_value;

    /*if([DATE, DATETIME, TIME].includes(type) && default_value === 'CURRENT_TIMESTAMP') {
      default_value = 'CURRENT_TIMESTAMP';
    }*/

    const types = {}

    if ([DATE, DATE_TIME, TIME].includes(field.element)) {
      if (field.element === DATE) {
        defaultValue = loopar.utils.formatDate(defaultValue, 'YYYY-MM-DD');
      } else if (field.element === DATE_TIME) {
        defaultValue = loopar.utils.formatDateTime(defaultValue, 'YYYY-MM-DD HH:mm:ss');
      } else {
        defaultValue = loopar.utils.formatTime(defaultValue, 'HH:mm:ss');
      }
    }

    if(hasDefault){
      types.defaultValue = defaultValue;
    }
    //const DEFAULT = hasDefault ? `DEFAULT '${defaultValue}'` : '';

    const dataType = (type) => {
      if (field.element === ID) {
        types.autoIncrement = true;
        types.primaryKey = true;
      }

      const types = [
        ...(ELEMENT_DEFINITION(type, INPUT).type || []),
        ...UNIQUE
      ].join(' ').split(' ').filter(e => e !== "");

      return [...new Set(types)].join(' ');
    }

    //const fieldType = dataType(type && type.toString().length > 0 ? type : field.element);
    //return `${loopar.utils.UPPERCASE(fieldType)} ${DEFAULT}`;
  }

  debugText(text) {
    return (text || "").toString().replace(/ /g, "");
  }

  get coreConnection() {
    return new mysql.createConnection({ ...this.dbConfig, ...{ database: 'information_schema' } });
  }

  connection() {
    return this.sequelize;
  }

  start() {
    if (this.#connection) {
      this.#connection.connect();
    }
  }

  end() {
    if (this.#connection) {
      this.#connection.end();
    }
  }

  async alterSchema() {
    const connection = await this.coreConnection;

    return new Promise((resolve, reject) => {
      connection.query(`CREATE DATABASE IF NOT EXISTS ${this.dbConfig.database}`, (err, rows, fields) => {
        if (err) console.log(['_______________DATA BASE ERROR_______________', err]);
        err ? reject(err) : resolve();
      });
    });
  }

  async dropSchema(schema) {
    const connection = await this.coreConnection;
    return new Promise((resolve, reject) => {
      connection.query(`DROP SCHEMA ${schema}`, (err, rows, fields) => {
        if (err) console.log(['_______________DATA BASE ERROR_______________', err]);
        err ? reject(err) : resolve();
      });
    });
  }

  async beginTransaction() {
    this.transaction = true;
  }

  async endTransaction() {
    /*this.transaction = false;
    const connection = await this.connection();

    const execute = query => {
      return new Promise(resolve => {
        connection.query(query, (err, rows, fields) => {
          err ? connection.rollback(() => this.throw(err)) : resolve();
        });
      });
    }

    return new Promise(resolve => {
      connection.beginTransaction(async err => {
        err && this.throw(err);

        for (const query of this.transactions) {
          await execute(query);
        }

        this.transactions = [];
        connection.commit(err => err ? connection.rollback(() => this.throw(err)) : resolve());
      });
    });*/
  }

  throw(error) {
    this.transaction = false;
    this.transactions = [];

    loopar.throw(error);
  }

  async execute(query = this.query, inTransaction = true) {
    return new Promise(async resolve => {
      if (this.transaction && inTransaction) {
        this.transactions.push(query);
        resolve();
      } else {
        try {
          const r = await this.sequelize.query(query, { type: QueryTypes.SELECT});
          return resolve(r);
        } catch (err) {
          console.log(["_______________QUERY ERROR_______________", err, query]);
          return loopar.throw({
            code: 500,
            status: 500,
            title: 'QUERY ERROR',
            message: err.sqlMessage
          });
        }
      }
    });
  }

  getOperand(operand) {
    if (['===', '==', '='].includes(operand)) return '=';
    if (['!==', '!=', '<>'].includes(operand)) return '<>';
    if (['>', '>='].includes(operand)) return '>=';
    if (['<', '<='].includes(operand)) return '<=';
    if (['in', 'IN'].includes(operand)) return 'IN';
    if (['not in', 'NOT IN'].includes(operand)) return 'NOT IN';
    if (['like', 'LIKE'].includes(operand)) return 'LIKE';
    if (['not like', 'NOT LIKE'].includes(operand)) return 'NOT LIKE';
    if (['between', 'BETWEEN'].includes(operand)) return 'BETWEEN';
    if (['not between', 'NOT BETWEEN'].includes(operand)) return 'NOT BETWEEN';
    if (['is', 'IS'].includes(operand)) return 'IS';
    if (['is not', 'IS NOT'].includes(operand)) return 'IS NOT';
    if (['regexp', 'REGEXP'].includes(operand)) return 'REGEXP';
    if (['not regexp', 'NOT REGEXP'].includes(operand)) return 'NOT REGEXP';
    if (['not', 'NOT'].includes(operand)) return 'NOT';
    if (['and', 'AND', '&&'].includes(operand)) return 'AND';
    if (['or', 'OR', '||'].includes(operand)) return 'OR';

    return null;
  }

  example() {
    const filter = {
      "=": {
        from_document: this.__ENTITY__.name,
        from_id: 8
      },
      "AND": {
        "=": {
          from_document: this.__ENTITY__.name,
          from_id: 8
        },
        "OR": {
          "BETWEEN": {
            to_document: ["a", "z"]
          },
          "IN": {
            to_document: ["a", "z"]
          },
          "LIKE": [
            ["to_document", "from_id"], "TEST"
          ]
        }
      }
    }

    return "WHERE(`from_document` = 'Menu' AND `from_id` = 8) AND ((`from_document` = 'Menu' AND `from_id` = 8) OR (to_document BETWEEN 'a' AND 'z' AND to_document IN('a', 'z') AND CONCAT(`to_document`, `from_id`) LIKE '%TEST%'))"
  }

  async WHERE(__CONDITIONS__ = null) {
    const WHERE = (__CONDITIONS__) => {
      return Object.entries(__CONDITIONS__ || {}).reduce((acc, [operand, DEF]) => {
        operand = this.getOperand(operand);
        if (['AND', 'OR'].includes(operand)) {
          const W = WHERE(DEF);
          return [...acc, acc.length && W.length ? operand : null, ...W].filter(e => e);
        } else {
          if (["IN", "NOT IN", "BETWEEN", "NOT BETWEEN", "IS", "IS NOT", "LIKE", "NOT LIKE"].includes(operand)) {
            let [FIELD, VALUE] = Object.entries(DEF)[0];

            if (!VALUE || (Array.isArray(VALUE) && VALUE.length === 0)) VALUE = [null]

            if (["IN", "NOT IN"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} (${VALUE.map(v => this.#escape(v)).join(',')})`];
            } else if (["BETWEEN", "NOT BETWEEN"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} ${VALUE.map(v => this.#escape(v)).join(' AND ')}`];
            } else if (["LIKE", "NOT LIKE"].includes(operand)) {
              if (Array.isArray(DEF)) {
                const field = Array.isArray(DEF[0]) ? `CONCAT(${DEF[0].map(f => this.#escapeId(f)).join(',')})` : this.#escapeId(DEF[0]);
                return [...acc, `${field} ${operand} ${this.#escape(`%${DEF[1]}%`)}`];
              } else {
                return [...acc, `${FIELD} ${operand} ${this.#escape(`%${VALUE}%`)}`];
              }
            } else if (["IS", "IS NOT"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} ${this.#escape(VALUE)}`];
            }
          } else {
            const def = `${Object.entries(DEF).reduce((acc, [key, value]) => {
              return [...acc, `LOWER(${this.#escapeId(key)}) ${operand} LOWER(${this.#escape(value)})`];
            }, []).join(' AND ')}`;

            return def.length > 0 ? [...acc, `(${def})`] : acc;// [...acc, def.length > 0 ? `(${def})` : []];
          }
        }
      }, [])
    }
    const query = WHERE(__CONDITIONS__);
    return [query.length ? 'AND' : null, ...query].filter(e => e).join(' ');
  }

  makePagination() {
    return this.pagination || {
      page: 1,
      pageSize: 5,
      totalPages: 4,
      totalRecords: 1,
      sortBy: "id",
      sortOrder: "asc"
    };
  }

  setPage(page) {
    this.pagination ? this.pagination.page = page : this.makePagination();
  }

  async getLastId(document) {
    return await this.getOneField(`SELECT MAX(id) as id FROM ${this.tableName(document)}`);
  }

  isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  #escape(value) {
    try {
      return this.sequelize.escape(value);
    } catch (e) {
      return 'NULL';
    }
  }

  #escapeId(value) {
    return `\`${value}\``;
  }

  objectToSqlSet(obj) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);

    // Crear la cadena 'key=value' para cada clave y valor
    const setString = keys.map((key, index) => {
      const value = values[index];

      // Si el valor es una cadena de texto, debe estar entre comillas simples
      if (typeof value === 'string') {
        return `${key} = '${value.replace(/'/g, "''")}'`;  // Escapar comillas simples
      }

      // Si el valor es booleano, lo convertimos a 1 o 0
      if (typeof value === 'boolean') {
        return `${key} = ${value ? 1 : 0}`;
      }

      // Si el valor es null, ponerlo explícitamente como NULL
      if (value === null) {
        return `${key} = NULL`;
      }

      // Para los números y otros tipos de datos
      return `${key} = ${value}`;
    }).join(', ');

    return setString;
  }

  objectToSqlInsert(obj) {
    const keys = Object.keys(obj);
    const values = Object.values(obj);

    const setString = keys.map((key, index) => {
      const value = values[index];

      if (typeof value === 'string') {
        return `'${value.replace(/'/g, "''")}'`;
      }

      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }

      if (value === null) {
        return 'NULL';
      }

      return value;
    }).join(', ');
  
    return setString;
  }

  /*async insertOne(document, data = {}, isSingle = false) {
    if(await this._count(document, { field_name: 'name', field_value: data.name }) > 0) {
      return await this.execute(`UPDATE ${this.tableName(document)} SET ${this.objectToSqlSet(data)} WHERE name = '${data.name}'`, false);
    }else{
      return await this.execute(`INSERT INTO ${this.tableName(document)} (${Object.keys(data).map(c => this.#escapeId(c)).join(',')}) VALUES (${Object.values(data).map(v => this.#escape(v)).join(",")})`, false);
    }
  }*/

  async insertRow(document, data = {}, isSingle = false) {
    if (isSingle) {
      for(const field of Object.keys(data)) {
        const values = {
          name: document + '-' + field,
          document: document,
          field: field,
          value: data[field] || "",
          __document_status__: 'Active'
        }

        if(await SingleModel.count({ where: {name: values.name} }) > 0) {
          await SingleModel.update(values, { where: {name: values.name} });
        }else{
          await SingleModel.create(values);
        }
      }
    } else {
      await this.execute(`
        INSERT INTO ${this.tableName(document)} 
        (${Object.keys(data).map(c => this.#escapeId(c)) .join(',')}) 
        VALUES (${Object.values(data).map(v => this.#escape(v || "")).join(",")})
      `);
    }
  }

  async mergeData(data) {
    return Object.keys(data).map(x => {
      return `${this.#escapeId(x)}=${this.#escape(data[x])}`
    }).join(',');
  }

  async setValue(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    return await this.#setValueTo(document, field, value, name, { distinctToId, ifNotFound });
  }

  async #setValueTo(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    const condition = {
      ...(typeof name === 'object' ? name : { '=': { name: name } }),
    };

    if (distinctToId) {
      condition.AND = {
        '!=': { id: distinctToId }
      }
    }

    const where = await this.WHERE(condition);

    const query = `
      UPDATE ${this.tableName(document)}
      SET ${this.#escapeId(field)}=${this.#escape(value)} 
      WHERE 1=1 ${where}
   `;

    await this.execute(query, false);
  }

  async updateRow(document, data = {}, name, isSingle = false) {
    data = await this.mergeData(data);
    const query = `UPDATE ${this.tableName(document)} SET ${data} WHERE \`name\`=${this.#escape(name)}`;
    await this.execute(query, false);
  }

  async deleteRow(document, name, sofDelete = true) {
    const deletedName = `${name}-${loopar.utils.randomString(20)}`;
    let query = `DELETE FROM ${this.tableName(document)} WHERE \`name\` = '${name}'`;
    if (sofDelete) {
      query = `
        UPDATE ${this.tableName(document)}
        SET __document_status__ = 'Deleted', name='${deletedName}'
        WHERE \`name\` = '${name}'
      `;
    }

    await this.execute(query, false);
  }

  get _query() {
    return new Promise(res => {
      res(this.query);
    });
  }

  fixFields(columns, is_new = false) {
    let existColumn = false;

    const fixFields = (fields = columns, field_data = {}) => {
      return fields.map(field => {
        if (field.data.name === field_data.data.name) {
          existColumn = true;
          Object.assign(field.data, field_data.data);
        }

        field.elements = fixFields(field.elements || [], field_data);

        if (is_new && field.data.required) {
          field.data.in_list_view = 1;
        }

        return field;
      });
    }

    const nameStructure = {
      element: INPUT,
      is_writable: true,
      data: {
        name: 'name',
        label: 'Name',
        type: 'text',
        required: 1,
        in_list_view: 1,
        set_only_time: 1
      }
    };

    const idStructure = {
      element: ID,
      is_writable: true,
      data: {
        name: 'id',
        label: 'ID',
        type: INTEGER,
        required: 1,
        in_list_view: 0,
        hidden: 1
      }
    };

    columns = fixFields(columns, nameStructure);

    if (!existColumn) {
      columns = [nameStructure, ...columns];
    }

    return [idStructure, ...columns];
  }

  makeColumns(fields, dbFields = {}) {
    return fields.reduce((acc, field) => {
      if (fieldIsWritable(field)) {
        const def = ELEMENT_DEFINITION(field.element);
        acc[field.data.name] = {
          type: def.type,
          ...field.data.required && { allowNull: false },
        };

        if(field.data.name == 'id') {
          acc[field.data.name].primaryKey = true;
          //acc[field.data.name].autoIncrement = true;
        }
      }

      if (field.elements) {
        Object.assign(acc, this.makeColumns(field.elements || [], dbFields));
      }

      return acc;
    }, {});
  }

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.#escape(table) : this.#escapeId(table);
  }

  async makeTable(name, fields) {
    const tableQuery = await this.alterTableQueryBuild(name, fields, (loopar.DBInitialized && loopar.__installed__));
    //await this.execute(tableQuery, false);
  }

  async describeTable(document) {
    return await this.sequelize.getQueryInterface().describeTable(this.tableName(document).replace(/`/g, ''));
  }

  async alterTableQueryBuild(document, fields = {}, checkIfExists = true) {
    const TABLE = this.tableName(document).replace(/`/g, '');
    const [exist, hasPk] = checkIfExists ? [await this.count(document), await this.hasPk(document)] : [false, false];

    if (exist) {
      let dbFields = {};

      try {
        dbFields = await this.describeTable(document);
      }catch(e) {
        dbFields = {};
      }

      const columns = this.makeColumns(fields, dbFields);

      for (const field of Object.keys(columns)) {
        if(dbFields[field]){
          await this.sequelize.getQueryInterface().changeColumn(TABLE, field, columns[field]);
        }else{
          await this.sequelize.getQueryInterface().addColumn(TABLE, field, columns[field]);
        }
      }
    } else {
      const columns = this.makeColumns(fields);
      
      console.log(["_______________CREATE TABLE_______________", TABLE, exist,  columns]);
      await this.sequelize.getQueryInterface().createTable(TABLE, columns);
    }
  }

  async #getDbValue(document, field, name) {
    const where = typeof name === 'object' ? `WHERE 1=1 ${await this.WHERE(name)}` : `WHERE \`name\` = ${await this.#escape(name)}`;
    return await this.getOneField(`SELECT ${this.#escapeId(field)} FROM ${this.tableName(document)} ${where}`);
  }

  async getValue(document, field, name, { distinctToId = null, ifNotFound = "throw", includeDeleted = false } = {}) {
    try {
      const condition = {
        ...(typeof name === 'object' ? name : { '=': { name: name } }),
      };

      if (distinctToId) {
        condition.AND = {
          '!=': { id: distinctToId }
        }
      }

      const result = await this.getDoc(document, condition, [field], { includeDeleted });

      return result ? typeof field === "object" ? result : result[field] : null;
    } catch (e) {
      if (ifNotFound === "throw") throw e;

      return ifNotFound;
    }
  }

  async getDoc(document, name, fields = ['*'], { includeDeleted = false } = {}) {
    document = document == "Document" ? "Entity" : document;
    const ref = loopar.getRef(document);
    return await this.getRow(document, name, fields, { isSingle: ref.is_single, includeDeleted });
  }

  async getRow(table, id, fields = ['*'], { isSingle = false, includeDeleted = false } = {}) {
    this.setPage(1);
    const row = await this.getList(table, fields, typeof id == 'object' ? id : {
      '=': {
        'name': id
      }
    }, { isSingle, includeDeleted });

    return row.length ? row[0] : null;
  }

  async getList(document, fields = ['*'], condition = null, { isSingle = false, all = false, includeDeleted = false } = {}) {
    if (isSingle) {
      const singleTable = this.tableName('Document Single Values');
      const result = await this.execute(`SELECT field, value from ${singleTable} WHERE \`document\` = '${document}'`, false);
      return [result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {})];
    } else {
      const tableName = this.tableName(document, false);
      fields = await this.makeFields(fields);
      condition = await this.WHERE(condition);

      const sofDelete = includeDeleted ? "WHERE 1=1" : "WHERE `__document_status__` <> 'Deleted'";
      let query = `SELECT ${fields} FROM ${tableName} ${sofDelete} ${condition}`;

      if (!all) {
        const pagination = this.makePagination();
        const [PAGE, PAGE_SIZE] = [pagination.page, pagination.pageSize];
        const OFFSET = (PAGE - 1) * PAGE_SIZE;

        query += ` LIMIT ${PAGE_SIZE} OFFSET ${OFFSET}`;
      }

      return await this.execute(query, false);
    }
  }

  async getAll(document, fields = ['*'], condition = null, { isSingle = false } = {}) {
    return await this.getList(document, fields, condition, { isSingle, all: true });
  }


  async makeFields(fields = ['*']) {
    //const connection = await this.connection();
    return fields.map(field => field === '*' ? field : this.#escapeId(field)).join(',');
  }

  get masterSchema() {
    const dbSchema = {
      sqlite: "sqlite_master",
      mysql: "INFORMATION_SCHEMA.TABLES",
      postgres: "information_schema.tables",
      mssql: "INFORMATION_SCHEMA.TABLE",
      oracle: "user_tables"
    }[this.dbConfig.dialect];

    if (!dbSchema) {
      throw new Error("Database not supported");
    }

    return dbSchema;
  }

  async hasPk(document) {
    const table = this.tableName(document, true);

    if(this.dbConfig.dialect === 'sqlite') {
      return this.getOneField(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name = ${table} AND sql LIKE '%PRIMARY KEY%'`) > 0;
    }

    return this.getOneField(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE \`CONSTRAINT_TYPE\` = 'PRIMARY KEY' AND \`table_name\` = ${table} AND \`table_schema\` = '${this.database}'
    `);
  }

  async count(document) {
    const masterQuery = {
      sqlite: `SELECT COUNT(name) as count FROM sqlite_master WHERE type='table' AND name = ${this.tableName(document, true)}`,
      mysql: `SELECT COUNT(table_name) as count FROM INFORMATION_SCHEMA.TABLES WHERE \`table_name\` = ${this.tableName(document, true)} AND \`table_schema\` = '${this.database}'`
    }
    try {
      return await this.getOneField(masterQuery[this.dbConfig.dialect]);
    } catch (e) {
      return 0;
    }
  }

  async _count(document, params = { field_name: 'name', field_value: null }, condition = null) {
    if (!params) return 0;
    document = document === "Document" ? "Entity" : document;
    const param = typeof params === 'object' ? params : { field_name: "name", field_value: params };

    const c = {
      "!=": {
        __document_status__: "Deleted",
      },
      AND: condition
    };

    if (param.field_value) {
      c.AND = {
        "=": {
          [param.field_name]: param.field_value
        },
        AND: condition
      }
    }

    const WHERE = await this.WHERE(c);

    try {
      return await this.getOneField(
        `SELECT COUNT(*) as count FROM ${this.tableName(document)} WHERE 1=1 ${WHERE}`
      );
    } catch (error) {
      return 0;
    }
  }

  async testDatabase() {
    try {
      await this.sequelize.authenticate();
      return true;
    } catch (e) {
      return false;
    }
    /*const connection = await this.connection();
    return new Promise(resolve => {
      if (connection.state === 'authenticated') return resolve(true);

      connection.connect(err => {
        err && console.log(err);

        return resolve(!err);
      });
    });*/
  }

  async testServer() {
    try {
      await this.sequelize.authenticate();
      console.log('Connection has been established successfully.');
      return true;
    }catch (e) {
      return false;
    }
  }

  async testFramework(app) {
    const entities = loopar.getEntities(app);
    const tablesTest = [];

    for (const entity of entities) {
      if(entity.is_single) continue;
      tablesTest.push(this.tableName(entity.name, true));
    }
    
    const master  = {
      sqlite: `SELECT COUNT(name) as count FROM sqlite_master WHERE type='table' AND name in (${tablesTest.join(',')})`,
      mysql: `SELECT COUNT(table_name) as count FROM INFORMATION_SCHEMA.TABLES WHERE \`table_name\` in (${tablesTest.join(',')}) AND \`table_schema\` = '${this.database}'`,
    }

    return await this.getOneField(master[this.dbConfig.dialect]) >= (tablesTest.length-1);
  }

  async getOneField(Q){
    const r = await this.execute(Q, false);
    const obj = r.length ? r[0] : {};

    return Object.values(obj)[0];
  }
}
