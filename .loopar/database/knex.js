'use strict';
import { loopar, fileManage } from "loopar";
import knex from 'knex';

export default class DataBase {
  #connection = null;
  tablePrefix = 'tbl';
  transaction = false;
  transactions = [];

  constructor() { }

  get dbConfig() {
    return env.dbConfig || {};
  }

  get database() {
    return this.dbConfig.database;
  }

  async connectWithSqlite() {
    try {
      await fileManage.makeFolder('', "path/to");
      await fileManage.makeFile('path/to', this.database, '', 'sqlite');
      const dbPath = loopar.makePath(loopar.pathRoot, 'path/to', `${this.database}.sqlite`);

      this.knex = knex({
        client: 'sqlite3',
        connection: {
          filename: dbPath,
        },
      });
    } catch (e) {
      loopar.throw("SQLite database not possible to connect");
    }
  }

  async connectMySQL(database = null) {
    const dbConfig = this.dbConfig;
    const connection = dbConfig.connection || {};

    try {
      this.knex = knex({
        client: 'mysql',
        connection: {
          ...connection,
          database: database || dbConfig.database
        }
      });
    } catch (e) {
      if (!database) {
        await this.connectMySQL("information_schema");
      } else {
        await this.connectWithSqlite();
        loopar.throw("MySQL database not possible to connect, connecting to SQLite database");
      }
    }
  }

  async initialize() {
    const dbConfig = this.dbConfig;
    const dialect = dbConfig.dialect || "";

    if (dialect.includes('sqlite')) {
      return await this.connectWithSqlite();
    }

    if (dialect.includes('mysql')) {
      return await this.connectMySQL();
    }
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

    if (hasDefault) {
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
    if (this.dialect.includes('sqlite')) {
      return this.knex;
    } else {
      return knex(this.dbConfig);
    }
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
    try {
      await this.coreConnection.raw('CREATE DATABASE IF NOT EXISTS ' + this.database);
      //this.schema = await this.knex.withSchema(this.database);
    } catch (e) {
      console.log(["_______________DATA BASE ERROR_______________", e]);
    }
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

  throw(error) {
    this.transaction = false;
    this.transactions = [];

    loopar.throw(error);
  }

  /*async execute(query, {inTransaction=true, type=QueryTypes.SELECT} = {}) {
    inTransaction = type === QueryTypes.SELECT ? false : inTransaction;
    return new Promise(async resolve => {
      if (this.transaction && inTransaction) {
        this.transactions.push(query);
        resolve();
      } else {
        try {
          this.knex.raw(query).then(resolve);
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
  }*/

  async endTransaction() {
    return new Promise(resolve => {
      this.knex.transaction(async trx => {
        try {
          for (const query of this.transactions) {
            await trx.raw(query);
          }

          trx.isCompleted() ? await trx.commit() : await trx.rollback();
          resolve();
        } catch (e) {
          await trx.rollback();
          this.throw(e);
        }
      });
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

  /**example() {
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
  }*///

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
    //return await this.getOneField(`SELECT MAX(id) as id FROM ${this.tableName(document)}`);
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
    return `'${value}'`;
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

  getParseData(data) {
    return Object.entries(data).reduce((acc, [key, value]) => {
      value ??= null;
      typeof value === 'object' && (value = JSON.stringify(value));

      if (typeof value == 'string') {
        value === 'null' && (value = null);
        value === 'true' && (value = true);
        value === 'false' && (value = false);
        value === 'undefined' && (value = null);
      }

      acc[key] = value;
      return acc;
    }, {});
  }

  async insertRow(document, data = {}, isSingle = false) {
    data = this.getParseData(data);

    if (isSingle) {
      const values = []
      for (const field of Object.keys(data)) {
        values.push({
          name: document + '-' + field,
          document: document,
          field: field,
          value: data[field] || "",
          __document_status__: 'Active'
        });
      }
      await this.knex(this.literalTableName('Document Single Values')).insert(values).onConflict('name').merge();
    } else {
      await this.knex(this.literalTableName(document)).insert(data);
    }
  }

  async maxId(document) {
    const maxId = await this.knex(this.literalTableName(document)).max('id', { as: 'max' });
    return maxId[0]?.max
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

    return await this.knex(this.literalTableName(document)).whereRaw(`1=1 ${where}`).update({ [field]: value });
  }

  literalTableName(document) {
    return this.tableName(document).replace(/`/g, "");
  }

  async updateRow(document, data = {}, name) {
    data = this.getParseData(data);
    await this.knex(this.literalTableName(document)).where({ name }).update(data);
  }

  async deleteRow(document, name, sofDelete = true) {
    await this.knex(this.literalTableName(document)).where({ name }).del();
    /*if (sofDelete) {
      const newName = `${name}-${new Date().getTime()}`;
      await this.knex(this.literalTableName(document)).where({ name }).update({ __document_status__: 'Deleted', name: newName });
    } else {
      await this.knex(this.literalTableName(document)).where({ name }).del();
    }*/
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

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.#escape(table) : this.#escapeId(table);
  }

  makeColumns(fields, dbFields = {}, action = 'alter') {
    const getArsg = (args) => {
      return args.map(arg => {
        return typeof arg === 'string' ? `'${arg}'` : arg;
      }).join(',');
    }

    const existField = (name) => {
      return dbFields.some(f => f.name && name && (f.name.toLowerCase() == name.toLowerCase()));
    }

    return fields.reduce((acc, f) => {
      if (fieldIsWritable(f)) {
        const data = f.data;
        const def = [];
        let type = data.unique ? "string" : ELEMENT_DEFINITION(f.element).type;

        if (data.name == 'id' && action == 'create') {
          if (!this.dialect.includes('sqlite')) {
            type = 'increments';
          }
          /*if(!this.dialect.includes('sqlite')) {
            def.push({ fn: 'increments', args: [] });
          }*/
          def.push({ fn: 'primary', args: [] });
          def.push({ fn: 'unsigned', args: [] });
        }

        if (data.required) {
          def.push({ fn: 'notNullable', args: [] });
          if (data.default_value) {
            def.push({ fn: 'defaultTo', args: [data.default_value] });
          }
        }

        if (data.default_value && data.default_value.length > 0) {
          def.push({ fn: 'defaultTo', args: [data.default_value] });
        }

        if (data.unique && action == 'create') {
          def.push({ fn: 'unique', args: [] });
        }

        acc.push(`t.${type}('${data.name}'${data.unique ? ',255' : ''})${def.map(d => `.${d.fn}(${getArsg(d.args)})`).join('')}${existField(data.name) ? '.alter()' : ''}`);
      }

      if (f.elements) {
        acc.push(...this.makeColumns(f.elements, dbFields, action));
        //Object.assign(acc, this.makeColumns(f.elements || [], dbFields, action));
      }

      return acc;
    }, []);
  }

  get schema() {
    return this.knex.withSchema(this.database);
  }

  async makeTable(name, fields) {
    const TABLE = this.literalTableName(name);
    const exists = await this.knex.schema.hasTable(TABLE);
    const dbFields = exists ? await this.getTableDescription(name) : [];
    const cols = this.makeColumns(fields, dbFields, exists ? 'alter' : 'create');

    if (exists) {
      await this.knex.schema.alterTable(TABLE, t => {
        cols.forEach(c => eval(c));
      });
    } else {
      await this.knex.schema.createTable(TABLE, t => {
        cols.forEach(c => eval(c));
      });
    }
  }

  async describeTable(document) {
    return await this.sequelize.getQueryInterface().describeTable(this.tableName(document).replace(/`/g, ''));
  }

  async getTableDescription(document) {
    const queries = {
      sqlite: `PRAGMA table_info(${this.tableName(document).replace(/`/g, "'")})`,
      mysql: `DESCRIBE ${this.tableName(document)}`,
      postgres: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${this.tableName(document)}`,
      mssql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${this.tableName(document)}`,
      oracle: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = ${this.tableName(document)}`,
    }

    const cols = await this.knex.raw(queries[this.dbConfig.dialect]);
    return cols.flat().map(c => ({ name: c.column_name || c.name || c.Field }));
  }

  /*async #getDbValue(document, field, name) {
    const where = typeof name === 'object' ? `WHERE 1=1 ${await this.WHERE(name)}` : `WHERE \`name\` = ${await this.#escape(name)}`;
    return await this.getOneField(`SELECT ${this.#escapeId(field)} FROM ${this.tableName(document)} ${where}`);
  }*/

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
    const ref = typeof document === 'object' ? document.__REF__ : loopar.getRef(document);  
    document = typeof document === 'object' ? document.name : document;
    document = document == "Document" ? "Entity" : document;

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
      const result = await this.knex(this.literalTableName('Document Single Values')).where({ document: document }).select(["field", "value"]);
      return [result.reduce((acc, row) => ({ ...acc, [row.field]: row.value }), {})];
    } else {
      condition = await this.WHERE(condition);
      const sofDelete = includeDeleted ? "1=1" : "`__document_status__` <> 'Deleted'";

      if (!all) {
        const pagination = this.makePagination();
        const [PAGE, PAGE_SIZE] = [pagination.page, pagination.pageSize];
        const OFFSET = (PAGE - 1) * PAGE_SIZE;
        
        return await this.knex(this.literalTableName(document)).whereRaw(`${sofDelete} ${condition}`).select(fields).limit(PAGE_SIZE).offset(OFFSET);
      } else {
        return await this.knex(this.literalTableName(document)).whereRaw(`${sofDelete} ${condition}`).select(fields);
      }
    }
  }

  async getAll(document, fields = ['*'], condition = null, { isSingle = false } = {}) {
    return await this.getList(document, fields, condition, { isSingle, all: true });
  }

  async makeFields(fields = ['*']) {
    //const connection = await this.connection();
    return fields.map(field => field === '*' ? field : this.#escape(field)).join();
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

  /*async hasPk(document) {
    const table = this.tableName(document, true);

    if(this.dbConfig.dialect === 'sqlite') {
      return this.getOneField(`SELECT COUNT(*) as count FROM sqlite_master WHERE type='table' AND name = ${table} AND sql LIKE '%PRIMARY KEY%'`) > 0;
    }

    return this.getOneField(`
      SELECT COUNT(*) as count 
      FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
      WHERE \`CONSTRAINT_TYPE\` = 'PRIMARY KEY' AND \`table_name\` = ${table} AND \`table_schema\` = '${this.database}'
    `);
  }*/

  async hastEntity(document) {
    return await this.knex.schema.hasTable(this.literalTableName(document));
  }

  async count(document, condition) {
    if (!condition) return 0;
    document = document === "Document" ? "Entity" : document;
    condition = typeof condition === 'object' ? condition : { "=" : {"name": condition} };

    const c = !loopar.installing ? {
      /*"!=": {
        //__document_status__: "Deleted",
      },*/
      AND: condition
    } : {
      AND: condition
    };

    /*if (param.field_value) {
      c.AND = {
        "=": {
          [param.field_name]: param.field_value
        },
        AND: condition
      }
    }*/

    const WHERE = await this.WHERE(c);
    const table = this.literalTableName(document);
    const r = await this.knex(table).count('id as count').where(this.knex.raw(`1=1 ${WHERE}`));
    return r[0].count || 0;
  }

  get dialect() {
    return this.dbConfig.dialect || "";
  }

  async testDatabase() {
    const client = this.dialect;
    async function databaseExists(knex, dbName) {
      if (client.includes('mysql')) {
        const result = await knex.raw(`SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, [dbName]);
        return result[0].length > 0;
      } else if (client === 'pg') {
        const result = await knex.raw(`SELECT datname FROM pg_database WHERE datname = ?`, [dbName]);
        return result.rows.length > 0;
      } else {
        throw new Error(`Cannot verify existence of database for client: ${client}`);
      }
    }

    if (client.includes('sqlite')) {
      return true;
    }

    try {
      await databaseExists(this.knex, this.database);
      loopar.printSuccess('Database connected successfully');
      return true;
    } catch (e) {
      loopar.printError('Database not connected');
      return false;
    }
    //await databaseExists(this.knex, this.database);

    /*try {
      const db = await this.knex.withSchema(this.database)//.raw('SELECT 1+1 as result');
      console.log('Has schema...', db);
      return !!db;
    } catch (error) {
      console.log('Err on test database', error);
      return false;
    }*/
  }

  async testServer() {
    try {
      this.coreConnection.raw('SELECT 1+1 as result');
      loopar.printSuccess('Database server is running');
      return true;
    } catch (e) {
      loopar.printError('Database server is not running');
      return false;
    }
  }

  async testFramework(app) {
    if (!loopar.DBServerInitialized || !loopar.DBInitialized) {
      console.log([loopar.DBServerInitialized, loopar.DBInitialized]);
      loopar.printError(`Loopar framework is not installed`);
      return false;
    }

    const entities = loopar.getEntities(app).filter(e => e.__document_status__ !== 'Deleted');
    if (entities.length === 0) {
      return false;
    }

    for (const entity of entities) {
      const ref = loopar.getRef(entity.name);
      if (ref.is_single || ref.is_builder) continue;

      const exist = await this.knex.schema.hasTable(this.literalTableName(entity.name));

      if (!exist) {
        console.log(["_______________ENTITY NOT FOUND_______________", entity.name]);
        loopar.printError(`Loopar framework is not installed`);
        return false;
      }
    }

    loopar.printSuccess(`Loopar framework is installed`);
    return true;
  }

  async getOneField(Q) {
    const r = await this.execute(Q);
    const obj = r.length ? r[0] : {};

    return Object.values(obj)[0];
  }
}
