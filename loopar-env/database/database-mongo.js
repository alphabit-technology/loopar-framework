'use strict';

import MongoClient from 'mongodb';

import mysql from 'mysql';
import ObjectManage from "../core/ObjectManage.js";
import { UPPERCASE } from '../core/helper.js';
import { loopar } from "../core/loopar.js";

const ENGINE = 'ENGINE=INNODB';

export default class DataBaseMongo extends ObjectManage {
   #connection = null;
   table_prefix = 'tbl';
   transaction = false;
   transactions = [];

   constructor() {
      super();
   }

   get db_config() {
      return env.db_config;
   }

   get database() {
      return this.db_config.database;
   }

   async initialize() {
      const url = 'mongodb://localhost:27017'; // URL de conexión a MongoDB
      const dbName = 'nombre-de-tu-base-de-datos'; // Nombre de tu base de datos

      return new Promise(async (resolve, reject) => {
         MongoClient.connect(url, function (err, client) {
            if (err) {
               console.log(err);
               return;
            }

            this.#connection = client;


            //this.#connection = client.db(dbName);

            // A partir de aquí, puedes ejecutar operaciones en la base de datos
         });

      });
      //this.#connection = new mysql.createConnection(this.db_config);
   }

   datatype(field) {
      const UNIQUE = [field.data.unique ? 'NOT NULL UNIQUE' : ''];

      const type = field.element === 'input' ? field.data.format : field.element;
      const default_value = field.data.default_value ? `DEFAULT '${field.data.default_value}'` : '';

      const data_type = (type) => {
         if (field.element === ID) {
            return 'INT(11) AUTO_INCREMENT';
         }

         const types = [
            ...(ELEMENT_DEFINITION(type, INPUT).type || []),
            ...UNIQUE
         ].join(' ').split(' ').filter(e => e !== "");

         return [...new Set(types)].join(' ');
      }

      return UPPERCASE(`${data_type(this.debug_text(type && type.toString().length > 0 ? type : field.element))} ${default_value}`);
   }

   debug_text(text) {
      return (text || "").toString().replace(/ /g, "");
   }

   get core_connection() {
      return new mysql.createConnection({ ...this.db_config, ...{ database: 'information_schema' } });
   }

   get connection() {
      return this.#connection;
   }

   start() {
      if (this.#connection) {
         //this.#connection.connect();
      }
   }

   end() {
      if (this.#connection) {
         //this.#connection.end();
      }
   }

   async alter_schema() {
      //const connection = await this.core_connection;

      this.#connection.db(this.db_config.database, async (err) => {
         if (err) {
            console.log(err);
            return;
         }

      });
      /*return new Promise((resolve, reject) => {
         connection.query(`CREATE DATABASE IF NOT EXISTS ${this.db_config.database}`, (err, rows, fields) => {
            if (err) console.log(['_______________DATA BASE ERROR_______________', err]);
            err ? reject(err) : resolve();
         });
      });*/
   }

   async begin_transaction() {
      this.transaction = true;
   }

   async end_transaction() {
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
      //console.log(["**********execute query**********", query, "**********execute query**********"]);
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

   get_operand(operand) {
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

   make_condition(__CONDITIONS__ = null) {
      const con = this.connection;

      const make_condition = (__CONDITIONS__) => {
         return Object.entries(__CONDITIONS__ || {}).map(([operand, definition]) => {
            if (['AND', 'OR'].includes(this.get_operand(operand))) {
               return `${this.get_operand(operand)} ${make_condition(definition)}`;
            } else {
               const [sub_operand, field, value] = [this.get_operand(operand), Object.keys(definition)[0], Object.values(definition)[0]];

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

      const condition = make_condition(__CONDITIONS__);

      return condition.length > 0 ? `WHERE ${condition}` : '';
   }

   make_pagination() {
      return this.pagination || {
         page: 1,
         page_size: 5,
         total_pages: 4,
         total_records: 1,
         sort_by: "id",
         sort_order: "asc"
      };
   }

   set_page(page) {
      this.pagination ? this.pagination.page = page : this.make_pagination();
   }

   is_json(str) {
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

   async insert_row(document, data = {}, is_single = false) {
      return new Promise(async (resolve, reject) => {
         const con = this.connection;

         if (is_single) {
            const fields = ['name', 'document', 'field', 'value'];

            const values = Object.entries(data).reduce((acc, [field, value]) => {
               acc.push(`(${con.escape(document + '-' + field)},${con.escape(document)},${con.escape(field)},${con.escape(value)})`);

               return acc;
            }, []);

            const single_table = this.table_name('Document Single Values');

            const on_duplicate_key = fields.map(field => `${field} = VALUES(${field})`).join(',');

            const query = `INSERT INTO ${single_table} (${fields.join(',')}) VALUES ${values.join(',')} ON DUPLICATE KEY UPDATE ${on_duplicate_key}`;

            this.execute(query, false).then(resolve).catch(reject);
         } else {
            con.query(`INSERT INTO ${this.table_name(document)} SET ?`, data, function (error, results) {
               if (error) {
                  reject(error);
               } else {
                  resolve(results);
               }
            });
         }
      });
   }

   merge_data(data) {
      const connection = this.connection;

      return Object.keys(data).map(x => {
         return `${connection.escapeId(x)}=${connection.escape(data[x])}`
      }).join(',');
   }

   async update_row(document, data = {}, name, is_single = false) {
      const connection = this.connection;
      const query = `UPDATE ${this.table_name(document)} SET ${this.merge_data(data)} WHERE \`name\`=${connection.escape(name)}`;

      return new Promise((resolve, reject) => {
         this.execute(query).then(result => {
            resolve(result);
         }).catch(err => {
            reject(err);
         });
      });
   }

   async delete_row(document, name) {
      const query = `DELETE FROM ${this.table_name(document)} WHERE \`name\` = '${name}'`;

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

   fix_fields(columns, is_new = false) {
      let exist_column = false;

      const fix_fields = (fields = columns, field_data = {}) => {
         return fields.map(field => {
            if (field.data.name === field_data.data.name) {
               exist_column = true;
               Object.assign(field.data, field_data.data);
            }

            field.elements = fix_fields(field.elements || [], field_data);

            if (is_new && field.data.required) {
               field.data.in_list_view = 1;
            }

            return field;
         });
      }

      const name_structure = {
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

      const id_structure = {
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

      columns = fix_fields(columns, name_structure);

      if (!exist_column) {
         columns = [name_structure, ...columns];
      }

      return [id_structure, ...columns];
   }

   make_columns(fields, db_fields = {}) {
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

         return [...acc, ...this.make_columns(field.elements || [], db_fields)];
      }, [])
   }

   table_name(document, like_param = false) {
      const connection = this.connection;
      const table = `${this.table_prefix}${document}`;
      return like_param ? connection.escape(table) : connection.escapeId(table);
   }

   async make_table(name, fields) {
      const tableQuery = await this.alter_table_query_build(name, fields, !loopar.installing);
      await this.execute(tableQuery, false);
   }

   async alter_table_query_build(document, fields = {}, check_if_exists = true) {
      const TABLE = this.table_name(document);
      const [exist, has_pk] = check_if_exists ? [await this.count(document), await this.has_pk(document)] : [false, false];

      return new Promise(resolve => {
         if (exist) {
            this.execute(`SHOW COLUMNS FROM ${TABLE}`, false).then(columns => {
               const db_fields = columns.reduce((acc, col) => ({ ...acc, [col.Field]: col }), {});

               const alter_columns = [
                  ...this.make_columns(fields, db_fields),
                  ...(!has_pk ? [`ADD PRIMARY KEY (\`id\`)`] : [])
               ];

               this.query = `ALTER TABLE ${TABLE} ${alter_columns.join(',')} ;`;

               resolve(this.query);
            });
         } else {
            const columns = [...this.make_columns(fields), `PRIMARY KEY (\`id\`)`];

            this.query = `CREATE TABLE IF NOT EXISTS ${TABLE} (${columns.join(',')}) ${ENGINE};`;

            resolve(this.query);
         }
      });
   }

   async get_value(document, field, document_name, distinct_to_id = null, if_not_found = "throw") {

      try {
         const condition = {
            ...(typeof document_name === 'object' ? document_name : { '=': { name: document_name } }),
            ...(distinct_to_id ? { '!=': { id: distinct_to_id } } : {})
         };

         const result = await this.get_doc(document, condition, [field]);

         return result ? typeof field === "object" ? result : result[field] : null;
      } catch (e) {
         if (if_not_found === "throw") {
            throw e;
         }
         return if_not_found;
      }
   }

   async get_doc(document, document_name, fields = ['*'], is_single = false) {
      return await this.get_row(document, document_name, fields, is_single);
   }

   async get_row(table, id, fields = ['*'], is_single = false) {
      this.set_page(1);
      const row = await this.get_list(table, fields, typeof id == 'object' ? id : { '=': { 'name': id } }, is_single) || [];

      return row[0] || null;
   }

   async get_list(document, fields = ['*'], condition = null, is_single = false) {
      return new Promise((resolve, reject) => {
         if (is_single) {
            const single_table = this.table_name('Document Single Values');
            this.execute(`SELECT field, value from ${single_table} WHERE \`document\` = '${document}'`, false).then(result => {
               const single_values = result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {});

               resolve([single_values]);
            }).catch(err => {
               reject(err);
            });
         } else {
            const table_name = this.table_name(document, false);
            fields = this.#make_fields(fields);
            condition = this.make_condition(condition);
            const pagination = this.make_pagination();
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

   #make_fields(fields = ['*']) {
      return fields.map(field => field === '*' ? field : this.connection.escapeId(field)).join(',');
   }

   async has_pk(document) {
      const table = this.table_name(document, true);
      return new Promise(async resolve => {
         this.execute(`SELECT COUNT(*) as count FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE \`CONSTRAINT_TYPE\` = 'PRIMARY KEY' AND \`TABLE_NAME\` = ${table}`, false).then(res => {
            resolve(res[0].count);
         });
      });
   }

   async count(document) {
      const table = this.table_name(document, true);
      return new Promise(async resolve => {
         this.execute(`SELECT COUNT(table_name) as count FROM INFORMATION_SCHEMA.TABLES WHERE \`table_name\` = ${table}`, false).then(res => {
            resolve(res[0].count);
         });
      });
   }

   async _count(document, params = { field_name: 'name', field_value: null }, condition = null) {
      if (!params) return 0;
      const cn = this.connection;
      const c = this.make_condition(condition || {});
      const param = typeof params === 'object' ? params : { field_name: "name", field_value: params };

      return new Promise(async resolve => {
         const WHERE = param.field_value ?
            `WHERE ${cn.escapeId(param.field_name)}=${cn.escape(param.field_value)} ${c.replace('WHERE', 'AND')}` :
            c;

         this.execute(`SELECT COUNT(*) as count FROM ${this.table_name(document)} ${WHERE}`, false).then(async res => {
            resolve(res[0].count);
         });
      });
   }

   async test_database() {
      return new Promise(resolve => {
         if (this.connection.state === 'authenticated') return resolve(true);

         this.connection.connect(err => {
            err && console.log(err);

            return resolve(!err);
         });
      });
   }

   async test_server() {
      return new Promise(resolve => {
         if (this.core_connection.state === 'authenticated') return resolve(true);

         this.core_connection.connect(err => {
            err && console.log(err);

            return resolve(!err);
         });
      });
   }

   test_framework() {
      const tables_test = ['Document', 'Module', 'Module Group'].map(table => this.table_name(table, true));

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
