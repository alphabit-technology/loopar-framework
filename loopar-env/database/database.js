'use strict';

import mysql from 'mysql';
import ObjectManage from "../core/ObjectManage.js";
import { UPPERCASE } from '../core/helper.js';
import { loopar } from "../core/loopar.js";

const ENGINE = 'ENGINE=INNODB';

export default class DataBase extends ObjectManage {
   #connection = null;
   tablePrefix = 'tbl';
   transaction = false;
   transactions = [];

   constructor() {
      super();
   }

   get dbConfig() {
      return env.dbConfig;
   }

   get database() {
      return this.dbConfig.database;
   }

   async initialize() {
      this.#connection = new mysql.createConnection(this.dbConfig);
   }

   datatype(field) {
      const UNIQUE = [field.data.unique ? 'NOT NULL UNIQUE' : ''];

      const type = field.element === 'input' ? field.data.format : field.element;
      const default_value = field.data.default_value ? `DEFAULT '${field.data.default_value}'` : '';

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

      return UPPERCASE(`${dataType(this.debugText(type && type.toString().length > 0 ? type : field.element))} ${default_value}`);
   }

   debugText(text) {
      return (text || "").toString().replace(/ /g, "");
   }

   get coreConnection() {
      return new mysql.createConnection({ ...this.dbConfig, ...{ database: 'information_schema' } });
   }

   get connection() {
      return this.#connection;
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

   async beginTransaction() {
      this.transaction = true;
   }

   async endTransaction() {
      this.transaction = false;
      const connection = this.connection;

      return new Promise(resolve => {
         connection.beginTransaction(async err => {
            if (err) {
               this.throw(err);
            }

            const promises_transaction = this.transactions.map(query => {
               return new Promise(resolve => {
                  connection.query(query, (err, rows, fields) => {
                     if (err) {
                        connection.rollback(() => {
                           this.throw(err);
                        });
                     } else {
                        resolve();
                     }
                  });
               });
            });

            await Promise.all(promises_transaction);

            connection.commit(error => {
               if (error) {
                  connection.rollback(() => {
                     this.throw(error);
                  });
               }
               resolve();
            });
         });
      });
   }

   throw(error) {
      this.transaction = false;
      this.transactions = [];

      loopar.throw(error);
   }

   execute(query = this.query, in_transaction = true) {
      return new Promise(async (resolve, reject) => {
         if (this.transaction && in_transaction) {
            this.transactions.push(query);
            resolve();
         } else {
            try {
               const connection = this.connection;

               connection.query(query, (err, result) => {
                  err ? reject(err) : resolve(result);
               });
            } catch (err) {
               reject(err);
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

      return 'null';
   }

   makeCondition(__CONDITIONS__ = null) {
      const con = this.connection;

      const makeCondition = (__CONDITIONS__) => {
         return Object.entries(__CONDITIONS__ || {}).map(([operand, definition]) => {
            if (['AND', 'OR'].includes(this.getOperand(operand))) {
               return `${this.getOperand(operand)} ${makeCondition(definition)}`;
            } else {
               const [sub_operand, field, value] = [this.getOperand(operand), Object.keys(definition)[0], Object.values(definition)[0]];

               if (sub_operand) {
                  if (field === 'CONCAT') {
                     return `CONCAT(${definition.CONCAT.map(field => con.escapeId(field)).join(',')}) ${sub_operand} ${con.escape(definition.value)}`;

                  } else if (sub_operand === 'IN' || sub_operand === 'NOT IN') {
                     return `${field} ${sub_operand} (${value.map(v => con.escape(v)).join(',')})`;

                  } else if (sub_operand === 'BETWEEN' || sub_operand === 'NOT BETWEEN') {
                     return value.map(v => con.escape(v)).join(sub_operand);

                  } else if (sub_operand === 'LIKE' || sub_operand === 'NOT LIKE') {
                     return `${field} ${sub_operand} ${con.escape(`%${value}%`)}`;
                  } else {
                     return `AND ${field} ${sub_operand} ${con.escape(value)}`;
                  }
               }
            }
         }).join(' ').replace(/\s+/g, ' ').split('AND').filter(v => v !== '' && v !== " ").join('AND');
      }

      const condition = makeCondition(__CONDITIONS__);

      return condition.length > 0 ? `WHERE ${condition}` : '';
   }

   makePagination() {
      return this.pagination || {
         page: 1,
         page_size: 5,
         total_pages: 4,
         total_records: 1,
         sort_by: "id",
         sort_order: "asc"
      };
   }

   setPage(page) {
      this.pagination ? this.pagination.page = page : this.makePagination();
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
      connection = connection || this.connection;

      return connection.escape(value);
   }

   async insertRow(document, data = {}, is_single = false) {
      return new Promise(async (resolve, reject) => {
         const con = this.connection;

         if (is_single) {
            const fields = ['name', 'document', 'field', 'value'];

            const values = Object.entries(data).reduce((acc, [field, value]) => {
               acc.push(`(${con.escape(document + '-' + field)},${con.escape(document)},${con.escape(field)},${con.escape(value)})`);

               return acc;
            }, []);

            const singleTable = this.tableName('Document Single Values');

            const onDuplicateKey = fields.map(field => `${field} = VALUES(${field})`).join(',');

            const query = `INSERT INTO ${singleTable} (${fields.join(',')}) VALUES ${values.join(',')} ON DUPLICATE KEY UPDATE ${onDuplicateKey}`;

            this.execute(query, false).then(resolve).catch(reject);
         } else {
            con.query(`INSERT INTO ${this.tableName(document)} SET ?`, data, function (error, results) {
               if (error) {
                  reject(error);
               } else {
                  resolve(results);
               }
            });
         }
      });
   }

   mergeData(data) {
      const connection = this.connection;

      return Object.keys(data).map(x => {
         return `${connection.escapeId(x)}=${connection.escape(data[x])}`
      }).join(',');
   }

   async updateRow(document, data = {}, name, is_single = false) {
      const connection = this.connection;
      const query = `UPDATE ${this.tableName(document)} SET ${this.mergeData(data)} WHERE \`name\`=${connection.escape(name)}`;

      return new Promise((resolve, reject) => {
         this.execute(query).then(result => {
            resolve(result);
         }).catch(err => {
            reject(err);
         });
      });
   }

   async deleteRow(document, name) {
      const query = `DELETE FROM ${this.tableName(document)} WHERE \`name\` = '${name}'`;

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
      let exist_column = false;

      const fixFields = (fields = columns, field_data = {}) => {
         return fields.map(field => {
            if (field.data.name === field_data.data.name) {
               exist_column = true;
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

      if (!exist_column) {
         columns = [nameStructure, ...columns];
      }

      return [idStructure, ...columns];
   }

   makeColumns(fields, db_fields = {}) {
      db_fields = Object.values(db_fields).reduce((acc, field) => {
         acc[field.Field.toLowerCase()] = field;

         return acc;
      }, {});

      return fields.reduce((acc, field) => {
         if (fieldIsWritable(field)) {
            if (field.data.name !== 'name' || !db_fields["name"]) {
               const pre = Object.keys(db_fields).length > 0 ? db_fields[field.data.name] ? 'MODIFY' : 'ADD' : '';

               const column = `${pre} ${field.data.name} ${this.datatype(field)}`

               acc.push(column);
            }
         }

         return [...acc, ...this.makeColumns(field.elements || [], db_fields)];
      }, [])
   }

   tableName(document, like_param = false) {
      const connection = this.connection;
      const table = `${this.tablePrefix}${document}`;
      return like_param ? connection.escape(table) : connection.escapeId(table);
   }

   async makeTable(name, fields) {
      const tableQuery = await this.alterTableQueryBuild(name, fields, !loopar.installing);
      await this.execute(tableQuery, false);
   }

   async alterTableQueryBuild(document, fields = {}, check_if_exists = true) {
      const TABLE = this.tableName(document);
      const [exist, has_pk] = check_if_exists ? [await this.count(document), await this.hasPk(document)] : [false, false];

      return new Promise(resolve => {
         if (exist) {
            this.execute(`SHOW COLUMNS FROM ${TABLE}`, false).then(columns => {
               const db_fields = columns.reduce((acc, col) => ({ ...acc, [col.Field]: col }), {});

               const alter_columns = [
                  ...this.makeColumns(fields, db_fields),
                  ...(!has_pk ? [`ADD PRIMARY KEY (\`id\`)`] : [])
               ];

               this.query = `ALTER TABLE ${TABLE} ${alter_columns.join(',')} ;`;

               resolve(this.query);
            });
         } else {
            const columns = [...this.makeColumns(fields), `PRIMARY KEY (\`id\`)`];

            this.query = `CREATE TABLE IF NOT EXISTS ${TABLE} (${columns.join(',')}) ${ENGINE};`;

            resolve(this.query);
         }
      });
   }

   async getValue(document, field, document_name, distinct_to_id = null, if_not_found = "throw") {

      try {
         const condition = {
            ...(typeof document_name === 'object' ? document_name : { '=': { name: document_name } }),
            ...(distinct_to_id ? { '!=': { id: distinct_to_id } } : {})
         };

         const result = await this.getDoc(document, condition, [field]);

         return result ? typeof field === "object" ? result : result[field] : null;
      } catch (e) {
         if (if_not_found === "throw") {
            throw e;
         }
         return if_not_found;
      }
   }

   async getDoc(document, document_name, fields = ['*'], is_single = false) {
      return await this.getRow(document, document_name, fields, is_single);
   }

   async getRow(table, id, fields = ['*'], is_single = false) {
      this.setPage(1);
      const row = await this.getList(table, fields, typeof id == 'object' ? id : { '=': { 'name': id } }, is_single) || [];

      return row[0] || null;
   }

   async getList(document, fields = ['*'], condition = null, is_single = false) {
      return new Promise((resolve, reject) => {
         if (is_single) {
            const single_table = this.tableName('Document Single Values');
            this.execute(`SELECT field, value from ${single_table} WHERE \`document\` = '${document}'`, false).then(result => {
               const single_values = result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {});

               resolve([single_values]);
            }).catch(err => {
               reject(err);
            });
         } else {
            const table_name = this.tableName(document, false);
            fields = this.#makeFields(fields);
            condition = this.makeCondition(condition);
            const pagination = this.makePagination();
            const [PAGE, PAGE_SIZE] = [pagination.page, pagination.page_size];
            const OFFSET = (PAGE - 1) * PAGE_SIZE;

            this.execute(`SELECT ${fields} FROM ${table_name} ${condition} LIMIT ${PAGE_SIZE} OFFSET ${OFFSET};`, false).then(data => {
               resolve(data);
            }).catch(error => {
               reject(error);
            });
         }
      });
   }

   async getAll(document, fields = ['*'], condition = null, is_single = false) {
      return new Promise((resolve, reject) => {
         if (is_single) {
            const single_table = this.tableName('Document Single Values');
            this.execute(`SELECT field, value from ${single_table} WHERE \`document\` = '${document}'`, false).then(result => {
               const single_values = result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {});

               resolve([single_values]);
            }).catch(err => {
               reject(err);
            });
         } else {
            const table_name = this.tableName(document, false);
            fields = this.#makeFields(fields);
            condition = this.makeCondition(condition);

            this.execute(`SELECT ${fields} FROM ${table_name} ${condition};`, false).then(data => {
               resolve(data);
            }).catch(error => {
               reject(error);
            });
         }
      });
   }

   #makeFields(fields = ['*']) {
      return fields.map(field => field === '*' ? field : this.connection.escapeId(field)).join(',');
   }

   async hasPk(document) {
      const table = this.tableName(document, true);
      return new Promise(async resolve => {
         this.execute(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE \`CONSTRAINT_TYPE\` = 'PRIMARY KEY' AND \`TABLE_NAME\` = ${table}`, false).then(res => {
            resolve(res[0].count);
         });
      });
   }

   async count(document) {
      const table = this.tableName(document, true);
      return new Promise(async resolve => {
         this.execute(`SELECT COUNT(table_name) as count FROM INFORMATION_SCHEMA.TABLES WHERE \`table_name\` = ${table}`, false).then(res => {
            resolve(res[0].count);
         });
      });
   }

   async _count(document, params = { field_name: 'name', field_value: null }, condition = null) {
      if (!params) return 0;
      const cn = this.connection;
      const c = this.makeCondition(condition || {});
      const param = typeof params === 'object' ? params : { field_name: "name", field_value: params };

      return new Promise(async resolve => {
         const WHERE = param.field_value ?
            `WHERE ${cn.escapeId(param.field_name)}=${cn.escape(param.field_value)} ${c.replace('WHERE', 'AND')}` :
            c;

         this.execute(`SELECT COUNT(*) as count FROM ${this.tableName(document)} ${WHERE}`, false).then(async res => {
            resolve(res[0].count);
         });
      });
   }

   async testDatabase() {
      return new Promise(resolve => {
         if (this.connection.state === 'authenticated') return resolve(true);

         this.connection.connect(err => {
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

   testFramework() {
      const tables_test = ['Document', 'Module', 'Module Group'].map(table => this.tableName(table, true));

      const q = `
SELECT COUNT(table_name) as count
FROM INFORMATION_SCHEMA.TABLES 
WHERE \`table_name\` in (${tables_test.join(',')}) AND \`table_schema\` = '${this.database}'`;

      return new Promise(async resolve => {
         this.execute(q, false).then(res => {
            return resolve(res[0].count === tables_test.length);
         });
      });
   }
}
