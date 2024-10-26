'use strict';

import mysql from 'mysql';
import { loopar } from "../core/loopar.js";
import { Sequelize } from '@sequelize/core';

import { SqliteDialect } from '@sequelize/sqlite3';

const ENGINE = 'ENGINE=INNODB';

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

    /*this.sequelize = new Sequelize({
      dialect: SqliteDialect,
      storage: ':memory:', // or ''
      pool: { max: 1, idle: Infinity, maxUses: Infinity },
    });*/

    this.#connection = new mysql.createConnection(this.dbConfig);
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

    if ([DATE, DATE_TIME, TIME].includes(field.element)) {
      if (field.element === DATE) {
        defaultValue = loopar.utils.formatDate(defaultValue, 'YYYY-MM-DD');
      } else if (field.element === DATE_TIME) {
        defaultValue = loopar.utils.formatDateTime(defaultValue, 'YYYY-MM-DD HH:mm:ss');
      } else {
        defaultValue = loopar.utils.formatTime(defaultValue, 'HH:mm:ss');
      }
    }

    const DEFAULT = hasDefault ? `DEFAULT '${defaultValue}'` : '';

    const dataType = (type) => {
      if (field.element === ID) {
        return 'INT(11) AUTO_INCREMENT';
      }

      const types = [
        ...(ELEMENT_DEFINITION(type, INPUT).type || []),
        ...UNIQUE
      ].join(' ').split(' ').filter(e => e !== "");

      return [...new Set(types)].join(' ');
    }

    const fieldType = dataType(type && type.toString().length > 0 ? type : field.element);
    return `${loopar.utils.UPPERCASE(fieldType)} ${DEFAULT}`;
  }

  debugText(text) {
    return (text || "").toString().replace(/ /g, "");
  }

  get coreConnection() {
    return new mysql.createConnection({ ...this.dbConfig, ...{ database: 'information_schema' } });
  }

  connection() {
    return this.#connection || new mysql.createConnection(this.dbConfig);
    /*return new Promise(resolve => {
       this.pool.getConnection((err, connection) => {
          if (err) throw err; // not connected!
          resolve(connection);
       });
    });*/
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
    this.transaction = false;
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
    });
  }

  throw(error) {
    this.transaction = false;
    this.transactions = [];

    loopar.throw(error);
  }

  execute(query = this.query, inTransaction = true) {
    return new Promise(async (resolve, reject) => {
      if (this.transaction && inTransaction) {
        this.transactions.push(query);
        resolve();
      } else {
        //try {
        try {
          const connection = await this.connection();

          connection.query(query, (err, result) => {
            if (err) console.log(["_______________QUERY ERROR_______________", query, err]);
            //if (err) loopar.throw(err);
           // return resolve(result);
        
            if (err && err.code === 'ER_NO_SUCH_TABLE') {
              return loopar.throw({
                code: 404,
                status: 404,
                title: 'ER_NO_SUCH_TABLE',
                message: err.sqlMessage,
              });
            }

            if(err) {
              return loopar.throw({
                code: 500,
                status: 500,
                title: 'QUERY ERROR',
                message: err.sqlMessage
              });
            }

            return resolve(result);
          });
        } catch (err) {
          //return reject(err);
          return loopar.throw({
            code: 500,
            status: 500,
            title: 'QUERY ERROR',
            message: err.sqlMessage
          });
        }
        //} catch (err) {
        //  loopar.throw(err);
          //reject(err);
        //}
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
    const con = await this.connection();

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
              return [...acc, `${FIELD} ${operand} (${VALUE.map(v => con.escape(v)).join(',')})`];
            } else if (["BETWEEN", "NOT BETWEEN"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} ${VALUE.map(v => con.escape(v)).join(' AND ')}`];
            } else if (["LIKE", "NOT LIKE"].includes(operand)) {
              if (Array.isArray(DEF)) {
                const field = Array.isArray(DEF[0]) ? `CONCAT(${DEF[0].map(f => con.escapeId(f)).join(',')})` : con.escapeId(DEF[0]);
                return [...acc, `${field} ${operand} ${con.escape(`%${DEF[1]}%`)}`];
              } else {
                return [...acc, `${FIELD} ${operand} ${con.escape(`%${VALUE}%`)}`];
              }
            } else if (["IS", "IS NOT"].includes(operand)) {
              return [...acc, `${FIELD} ${operand} ${con.escape(VALUE)}`];
            }
          } else {
            const def = `${Object.entries(DEF).reduce((acc, [key, value]) => {
              return [...acc, `${con.escapeId(key)} ${operand} ${con.escape(value)}`];
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

  getLastId(document) {
    return new Promise((resolve, reject) => {
      this.execute(`SELECT MAX(id) as id FROM ${this.tableName(document)}`, false).then(result => {
        resolve(result[0].id);
      }).catch(err => {
        reject(err);
      });
    });
  }

  isJson(str) {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  }

  async #escape(value, connection = null) {
    connection = connection || await this.connection();

    return connection.escape(value);
  }

  async #escapeId(value, connection = null) {
    connection = connection || await this.connection();

    return connection.escapeId(value);
  }

  async insertRow(document, data = {}, isSingle = false) {
    return new Promise(async (resolve, reject) => {
      const con = await this.connection();

      if (isSingle) {
        const fields = ['name', 'document', 'field', 'value'];

        const values = Object.entries(data).reduce((acc, [field, value]) => {
          acc.push(`(${con.escape(document + '-' + field)},${con.escape(document)},${con.escape(field)},${con.escape(value)})`);

          return acc;
        }, []);

        const singleTable = await this.tableName('Document Single Values');

        const onDuplicateKey = fields.map(field => `${field} = VALUES(${field})`).join(',');

        const query = `INSERT INTO ${singleTable} (${fields.join(',')}) VALUES ${values.join(',')} ON DUPLICATE KEY UPDATE ${onDuplicateKey}`;

        this.execute(query, false).then(resolve).catch(reject);
      } else {
        con.query(`INSERT INTO ${await this.tableName(document)} SET ?`, data, function (error, results) {
          error ? reject(error) : resolve(results);
        });
      }
    });
  }

  async mergeData(data) {
    const connection = await this.connection();

    return Object.keys(data).map(x => {
      return `${connection.escapeId(x)}=${connection.escape(data[x])}`
    }).join(',');
  }

  async setValue(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    return await this.#setValueTo(document, field, value, name, { distinctToId, ifNotFound });
  }

  async #setValueTo(document, field, value, name, { distinctToId = null, ifNotFound = "throw" } = {}) {
    const connection = await this.connection();

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
         UPDATE ${await this.tableName(document)}
         SET ${connection.escapeId(field)}=${connection.escape(value)} 
         WHERE 1=1 ${where}
      `;

    return new Promise((resolve, reject) => {
      this.execute(query).then(result => {
        resolve(result);
      }).catch(err => {
        reject(err);
      });
    });
  }

  async updateRow(document, data = {}, name, isSingle = false) {
    const connection = await this.connection();
    data = await this.mergeData(data);
    const query = `UPDATE ${await this.tableName(document)} SET ${data} WHERE \`name\`=${connection.escape(name)}`;

    return new Promise((resolve, reject) => {
      this.execute(query).then(result => {
        resolve(result);
      }).catch(err => {
        reject(err);
      });
    });
  }

  async deleteRow(document, name, sofDelete = true) {
    const deletedName = `${name}-${loopar.utils.randomString(20)}`;
    let query = `DELETE FROM ${await this.tableName(document)} WHERE \`name\` = '${name}'`;
    if (sofDelete) {
      query = `
         UPDATE ${await this.tableName(document)}
         SET __document_status__ = 'Deleted', name='${deletedName}'
         WHERE \`name\` = '${name}'`;
    }

    return new Promise((resolve, reject) => {
      this.execute(query).then(result => {
        resolve(result);
      }).catch(err => {
        reject(err);
      });
    });
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
    dbFields = Object.values(dbFields).reduce((acc, field) => {
      acc[field.Field.toLowerCase()] = field;

      return acc;
    }, {});

    return fields.reduce((acc, field) => {
      if (fieldIsWritable(field)) {
        if (field.data.name !== 'name' || !dbFields["name"]) {
          const pre = Object.keys(dbFields).length > 0 ? dbFields[field.data.name] ? 'MODIFY' : 'ADD' : '';
          const column = `${pre} ${field.data.name} ${this.datatype(field)}`;

          acc.push(column);
        }
      }

      return [...acc, ...this.makeColumns(field.elements || [], dbFields)];
    }, [])
  }

  async tableName(document, likeParam = false) {
    const connection = await this.connection();
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? connection.escape(table) : connection.escapeId(table);
  }

  async makeTable(name, fields) {
    const tableQuery = await this.alterTableQueryBuild(name, fields, (loopar.DBInitialized && loopar.__installed__));
    await this.execute(tableQuery, false);
  }

  async alterTableQueryBuild(document, fields = {}, checkIfExists = true) {
    const TABLE = await this.tableName(document);
    const [exist, hasPk] = checkIfExists ? [await this.count(document), await this.hasPk(document)] : [false, false];

    return new Promise(resolve => {
      if (exist) {
        this.execute(`SHOW COLUMNS FROM ${TABLE}`, false).then(columns => {
          const dbFields = columns.reduce((acc, col) => ({ ...acc, [col.Field]: col }), {});

          const alterColumns = [
            ...this.makeColumns(fields, dbFields),
            ...(!hasPk ? [`ADD PRIMARY KEY (\`id\`)`] : [])
          ];

          this.query = `ALTER TABLE ${TABLE} ${alterColumns.join(',')} ;`;

          resolve(this.query);
        });
      } else {
        const columns = [...this.makeColumns(fields), `PRIMARY KEY (\`id\`)`];

        //console.log(["CREATE TABLE", TABLE, columns]);

        this.query = `CREATE TABLE IF NOT EXISTS ${TABLE} (${columns.join(',')}) ${ENGINE};`;
        resolve(this.query);
      }
    });
  }

  async #getDbValue(document, field, name) {
    const where = typeof name === 'object' ? `WHERE 1=1 ${await this.WHERE(name)}` : `WHERE \`name\` = ${await this.#escape(name)}`;

    return new Promise(async (resolve, reject) => {
      this.execute(`SELECT ${await this.#escapeId(field)} FROM ${await this.tableName(document)} ${where}`, false).then(async result => {
        resolve((result[0] || {})[field]);
      }).catch(err => {
        reject(err);
      });
    });
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

  async getDoc(document, name, fields = ['*'], { isSingle, includeDeleted = false } = {}) {
    document = document === "Document" ? "Entity" : document;
    //const entityIsSingle = typeof isSingle != "undefined" ? isSingle : await this.#getDbValue("Entity", 'is_single', document, { includeDeleted });
    const ref = loopar.getRef(document);
    return await this.getRow(document, name, fields, { isSingle: ref.is_single, includeDeleted });
  }

  async getRow(table, id, fields = ['*'], { isSingle = false, includeDeleted = false } = {}) {
    this.setPage(1);
    const row = await this.getList(table, fields, typeof id == 'object' ? id : {
      '=': {
        'name': id
      }
    }, { isSingle, includeDeleted }) || [];

    return row[0] || null;
  }

  async getList(document, fields = ['*'], condition = null, { isSingle = false, all = false, includeDeleted = false } = {}) {
    if (isSingle) {
      const singleTable = await this.tableName('Document Single Values');
      const result = await this.execute(`SELECT field, value from ${singleTable} WHERE \`document\` = '${document}'`, false);
      return [result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {})];
    } else {
      const tableName = await this.tableName(document, false);
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
    const connection = await this.connection();
    return fields.map(field => field === '*' ? field : connection.escapeId(field)).join(',');
  }

  async hasPk(document) {
    const table = await this.tableName(document, true);
    return new Promise(async resolve => {
      this.execute(`
        SELECT COUNT(*) as count 
        FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
        WHERE \`CONSTRAINT_TYPE\` = 'PRIMARY KEY' AND \`table_name\` = ${table} AND \`table_schema\` = '${this.database}'
      `, false).then(res => {
        resolve(res[0].count);
      });
    });
  }

  async count(document) {
    const table = await this.tableName(document, true);
    return new Promise(async resolve => {
      try {
        //console.log([`SELECT COUNT(table_name) as count FROM INFORMATION_SCHEMA.TABLES WHERE \`table_name\` = ${table}`])
        this.execute(
          `
            SELECT COUNT(table_name) as count 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE \`table_name\` = ${table} AND \`table_schema\` = '${this.database}'
          `
          , false
        ).then(res => {
          resolve(res[0].count);
        });
      } catch (e) {
        resolve(0);
      }
    });
  }

  async _count(document, params = { field_name: 'name', field_value: null }, condition = null) {
    if (!params) return 0;
    document = document === "Document" ? "Entity" : document;
    const param = typeof params === 'object' ? params : { field_name: "name", field_value: params };

    return new Promise(async resolve => {
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
        this.execute(`SELECT COUNT(*) as count FROM ${await this.tableName(document)} WHERE 1=1 ${WHERE}`, false).then(async res => {
          resolve(res[0].count);
        });
      } catch (error) {
        resolve(0);
      }
    });
  }

  async testDatabase() {
    const connection = await this.connection();
    return new Promise(resolve => {
      if (connection.state === 'authenticated') return resolve(true);

      connection.connect(err => {
        err && console.log(err);

        return resolve(!err);
      });
    });
  }

  async testServer() {
    return new Promise(resolve => {
      if (this.coreConnection.state === 'authenticated') return resolve(true);

      this.coreConnection.connect(err => {
        err && console.log(err);

        return resolve(!err);
      });
    });
  }

  async testFramework() {
    const tablesTest = [];
    for (const table of ['Entity', 'Module', 'Module Group']) {
      tablesTest.push(await this.tableName(table, true))
    }
    //
    //const tables_test = ['Entity', 'Module', 'Module Group'].map(table => this.tableName(table, true));

    const q = `
SELECT COUNT(table_name) as count
FROM INFORMATION_SCHEMA.TABLES 
WHERE \`table_name\` in (${tablesTest.join(',')}) AND \`table_schema\` = '${this.database}'`;

    return new Promise(async resolve => {
      this.execute(q, false).then(res => {
        return resolve(res[0].count === tablesTest.length);
      });
    });
  }
}
