import { loopar } from "loopar";

export default class Core {
  constructor() {
    this.dbConfig = env.dbConfig || {};
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

  get database() {
    return this.dbConfig.database;
  }

  get coreConnection() {
    if (this.dialect.includes('sqlite')) {
      return this.knex;
    } else {
      return knex(this.dbConfig);
    }
  }

  async alterSchema() {
    try {
      await this.coreConnection.raw('CREATE DATABASE IF NOT EXISTS ' + this.database);
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

  get dialect() {
    return this.dbConfig.dialect || "";
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

  /*async describeTable(document) {
    return await this.sequelize.getQueryInterface().describeTable(this.tableName(document).replace(/`/g, ''));
  }*/

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

  escape(value) {
    return `'${value}'`;
  }

  escapeId(value) {
    return `\`${value}\``;
  }
}