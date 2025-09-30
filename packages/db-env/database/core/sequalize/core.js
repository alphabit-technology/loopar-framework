import { loopar } from "loopar";
import { Sequelize, QueryTypes } from '@sequelize/core';
import { SequelizeQueryManager } from './query-builder.js';

const tableDescriptionCache = new Map();
const TABLE_CACHE_TTL = 60000;

export default class Core {
  constructor(config = null) {
    this.customConfig = config;
    this.transactionStack = [];
  }

  get dbConfig() {
    return this.customConfig || env.dbConfig || {};
  }

  async #initialize(retries = 3) {
    const dbConfig = this.dbConfig;
    const dialect = dbConfig.dialect || "";

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        if (dialect.includes('sqlite')) {
          await this.connectWithSqlite();
        } else if (dialect.includes('mysql')) {
          await this.connectMySQL();
        } else {
          throw new Error(`Unsupported database dialect: ${dialect}`);
        }
        
        return;
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  async initialize() {
    await this.#initialize();
    this.queryManager = new SequelizeQueryManager(this.sequelize);
    
    if (process.env.NODE_ENV === 'development') {
      this.setupDebugHooks();
    }
  }

  setupDebugHooks() {
    const startTimes = new Map();
    
    this.sequelize.addHook('beforeQuery', (options) => {
      startTimes.set(options, Date.now());
    });
    
    this.sequelize.addHook('afterQuery', (options) => {
      const duration = Date.now() - startTimes.get(options);
      if (duration > 1000) {
        console.warn(`Slow query (${duration}ms):`, options.sql?.substring(0, 100));
      }
      startTimes.delete(options);
    });
  }

  get database() {
    return this.dbConfig.database;
  }

  get coreConnection() {
    if (this.dialect.includes('sqlite')) {
      return this.sequelize;
    }
    
    if (!this._coreConnection) {
      this._coreConnection = new Sequelize({
        ...this.dbConfig,
        pool: { max: 2, min: 0 }
      });
    }
    
    return this._coreConnection;
  }

  async alterSchema() {
    if (this.dialect.includes('sqlite')) {
      return;
    }

    try {
      const query = this.dialect.includes('mysql')
        ? `CREATE DATABASE IF NOT EXISTS \`${this.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        : `CREATE DATABASE IF NOT EXISTS "${this.database}"`;
        
      await this.coreConnection.query(query, { type: QueryTypes.RAW });
    } catch (error) {
      console.error('Database creation error:', error.message);
      throw error;
    }
  }

  async dropSchema(schema) {
    if (!schema || schema === 'information_schema' || schema === 'mysql') {
      throw new Error('Cannot drop system database');
    }

    try {
      const query = this.dialect.includes('mysql')
        ? `DROP DATABASE IF EXISTS \`${schema}\``
        : `DROP DATABASE IF EXISTS "${schema}"`;
        
      await this.coreConnection.query(query, { type: QueryTypes.RAW });
    } catch (error) {
      console.error('Database drop error:', error.message);
      throw error;
    }
  }

  async beginTransaction() {
    if (this.transaction) {
      throw new Error('Transaction already started');
    }
    this.transaction = await this.sequelize.startUnmanagedTransaction();
    return this.transaction;
  }

  async safeRollback() {
    if (!this.transaction) return;
    
    try {
      await this.transaction.rollback();
    } catch (error) {
      console.error('Rollback failed:', error.message);
    } finally {
      this.transaction = null;
    }
  }

  async endTransaction() {
    if (!this.transaction) return;

    try {
      await this.transaction.commit();
      this.transaction = null;
    } catch (commitError) {
      console.error('Commit failed:', commitError.message);
      await this.safeRollback();
      throw commitError;
    }
  }

  async rollbackTransaction() {
    await this.safeRollback();
  }

  throw(error) {
    if (this.transaction) {
      this.rollbackTransaction().catch(console.error);
    }
    loopar.throw(error);
  }

  get dialect() {
    return this.dbConfig.dialect || "";
  }

  get masterSchema() {
    const schemas = {
      sqlite: "sqlite_master",
      mysql: "INFORMATION_SCHEMA.TABLES",
      postgres: "information_schema.tables",
      mssql: "INFORMATION_SCHEMA.TABLES",
      oracle: "user_tables"
    };

    const dialect = this.dialect.split(':')[0];
    const schema = schemas[dialect];
    
    if (!schema) {
      throw new Error(`Database dialect not supported: ${dialect}`);
    }

    return schema;
  }

  async makeTable(name, fields) {
    const tableName = this.tableName(name);
    const literalName = this.literalTableName(name);
    const exists = await this.hasTable(literalName);
    
    if (exists) {
      const dbFields = await this.getTableDescription(name);
      await this.alterTable(tableName, fields, dbFields);
    } else {
      await this.createTable(tableName, fields);
    }
    
    tableDescriptionCache.delete(literalName);
  }

  async hasTable(tableName) {
    const cacheKey = `hasTable_${tableName}`;
    const cached = tableDescriptionCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < TABLE_CACHE_TTL) {
      return cached.value;
    }

    try {
      let query;
      
      if (this.dialect.includes('mysql')) {
        query = `SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`;
      } else if (this.dialect.includes('sqlite')) {
        query = `SELECT name FROM sqlite_master 
                 WHERE type='table' AND name = ? LIMIT 1`;
      } else {
        query = `SELECT 1 FROM information_schema.tables 
                 WHERE table_schema = current_schema() AND table_name = ? LIMIT 1`;
      }

      const replacements = this.dialect.includes('mysql') 
        ? [this.database, tableName]
        : [tableName];

      const result = await this.sequelize.query(query, {
        replacements,
        type: QueryTypes.SELECT
      });
      
      const exists = result && result.length > 0;
      
      tableDescriptionCache.set(cacheKey, {
        value: exists,
        timestamp: Date.now()
      });
      
      return exists;
    } catch (error) {
      return false;
    }
  }

  async createTable(tableName, fields) {
    const columns = this.generateColumnsSQL(fields, 'create');
    const indexes = this.generateIndexes(fields);
    
    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')}`;

    if (indexes.length > 0) {
      sql += `, ${indexes.join(', ')}`;
    }
    
    sql += ')';
    
    if (this.dialect.includes('mysql')) {
      sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';
    }
    
    await this.sequelize.query(sql, {
      type: QueryTypes.RAW,
      transaction: this.transaction
    });
  }

  async alterTable(tableName, fields, existingFields) {
    const existingColumns = new Set(
      existingFields.map(f => f.name.toLowerCase())
    );
    
    const alterations = [];
    
    for (const field of fields) {
      if (!this.fieldIsWritable(field)) continue;
      
      const columnName = field.data.name.toLowerCase();
      
      if (!existingColumns.has(columnName)) {
        const columnSQL = this.generateColumnSQL(field, 'alter');
        alterations.push(`ADD COLUMN ${columnSQL}`);
      }
      
      if (field.elements) {
        for (const element of field.elements) {
          if (this.fieldIsWritable(element)) {
            const elementName = element.data.name.toLowerCase();
            if (!existingColumns.has(elementName)) {
              const elementSQL = this.generateColumnSQL(element, 'alter');
              alterations.push(`ADD COLUMN ${elementSQL}`);
            }
          }
        }
      }
    }
    
    if (alterations.length > 0) {
      if (this.dialect.includes('mysql')) {
        const sql = `ALTER TABLE ${tableName} ${alterations.join(', ')}`;
        await this.sequelize.query(sql, {
          type: QueryTypes.RAW,
          transaction: this.transaction
        });
      } else {
        for (const alteration of alterations) {
          const sql = `ALTER TABLE ${tableName} ${alteration}`;
          await this.sequelize.query(sql, {
            type: QueryTypes.RAW,
            transaction: this.transaction
          });
        }
      }
    }
  }

  fieldIsWritable(field) {
    return field && field.data && field.data.name && !field.data.computed;
  }

  generateColumnsSQL(fields, action = 'create') {
    const columns = [];
    
    const processField = (field) => {
      if (this.fieldIsWritable(field)) {
        columns.push(this.generateColumnSQL(field, action));
      }
      
      if (field.elements && Array.isArray(field.elements)) {
        field.elements.forEach(processField);
      }
    };
    
    fields.forEach(processField);
    return columns;
  }

  generateColumnSQL(field, action) {
    const data = field.data;
    const columnName = this.escapeId(data.name);
    let type = this.getSequelizeColumnType(field);
    let sql = `${columnName} ${type}`;
    
    if (data.name === 'id' && action === 'create') {
      if (this.dialect.includes('mysql')) {
        return `${columnName} INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`;
      } else if (this.dialect.includes('sqlite')) {
        return `${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`;
      } else if (this.dialect.includes('postgres')) {
        return `${columnName} SERIAL PRIMARY KEY`;
      }
    }
    
    const constraints = [];
    
    if (data.required && data.name !== 'id') {
      constraints.push('NOT NULL');
    }
    
    if (data.default_value !== undefined && data.default_value !== null && data.default_value !== '') {
      const defaultValue = this.formatDefaultValue(data.default_value, field);
      constraints.push(`DEFAULT ${defaultValue}`);
    }
    
    if (data.unique && action === 'create') {
      constraints.push('UNIQUE');
    }
    
    if (constraints.length > 0) {
      sql += ' ' + constraints.join(' ');
    }
    
    return sql;
  }

  formatDefaultValue(value, field) {
    const type = field.element === 'INPUT' ? field.data.format : field.element;
    
    switch (type) {
      case 'boolean':
        return value ? 'TRUE' : 'FALSE';
      case 'int':
      case 'bigint':
      case 'float':
      case 'double':
      case 'decimal':
        return isNaN(value) ? '0' : value;
      case 'date':
      case 'datetime':
      case 'timestamp':
        return value === 'CURRENT_TIMESTAMP' ? value : this.escape(value);
      default:
        return this.escape(value);
    }
  }

  getSequelizeColumnType(field) {
    const element = field.element || 'INPUT';
    const format = field.data?.format || 'string';
    const type = element === 'INPUT' ? format : element;
    
    const typeMapping = {
      'string': 'VARCHAR(255)',
      'text': 'TEXT',
      'longtext': 'LONGTEXT',
      'int': 'INT',
      'bigint': 'BIGINT',
      'float': 'FLOAT',
      'double': 'DOUBLE',
      'decimal': `DECIMAL(${field.data?.precision || 10}, ${field.data?.scale || 2})`,
      'date': 'DATE',
      'datetime': 'DATETIME',
      'timestamp': 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
      'time': 'TIME',
      'boolean': this.dialect.includes('mysql') ? 'BOOLEAN' : 'INTEGER',
      'json': this.dialect.includes('mysql') ? 'JSON' : 'TEXT',
      'binary': 'BLOB',
      'uuid': this.dialect.includes('postgres') ? 'UUID' : 'VARCHAR(36)'
    };
    
    return typeMapping[type.toLowerCase()] || 'VARCHAR(255)';
  }

  generateIndexes(fields) {
    const indexes = [];
    
    for (const field of fields) {
      const data = field.data || {};
      
      if (data.index && data.name !== 'id') {
        const indexName = `idx_${data.name}`;
        indexes.push(`INDEX ${indexName} (${this.escapeId(data.name)})`);
      }
      
      if (data.unique && data.name !== 'id') {
        const uniqueName = `uniq_${data.name}`;
        indexes.push(`UNIQUE INDEX ${uniqueName} (${this.escapeId(data.name)})`);
      }
    }
    
    return indexes;
  }

  async getTableDescription(document) {
    const tableName = this.literalTableName(document);
    const cacheKey = `desc_${tableName}`;
    const cached = tableDescriptionCache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < TABLE_CACHE_TTL) {
      return cached.value;
    }

    let query;
    let mapFunction;
    
    if (this.dialect.includes('sqlite')) {
      query = `PRAGMA table_info('${tableName}')`;
      mapFunction = (row) => ({
        name: row.name,
        type: row.type,
        nullable: !row.notnull,
        default: row.dflt_value,
        primary: row.pk === 1
      });
    } else if (this.dialect.includes('mysql')) {
      query = `DESCRIBE \`${tableName}\``;
      mapFunction = (row) => ({
        name: row.Field,
        type: row.Type,
        nullable: row.Null === 'YES',
        default: row.Default,
        primary: row.Key === 'PRI'
      });
    } else {
      query = `SELECT column_name, data_type, is_nullable, column_default 
               FROM information_schema.columns 
               WHERE table_name = '${tableName}'`;
      mapFunction = (row) => ({
        name: row.column_name,
        type: row.data_type,
        nullable: row.is_nullable === 'YES',
        default: row.column_default,
        primary: false
      });
    }

    try {
      const result = await this.sequelize.query(query, {
        type: QueryTypes.SELECT
      });
      
      const description = result.map(mapFunction);
      
      tableDescriptionCache.set(cacheKey, {
        value: description,
        timestamp: Date.now()
      });
      
      return description;
    } catch (error) {
      console.error(`Error getting table description for ${tableName}:`, error.message);
      return [];
    }
  }

  escape(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    return this.sequelize.escape(value);
  }

  escapeId(identifier) {
    if (!identifier) return '';
    
    const clean = identifier.replace(/[`'"]/g, '');
    
    if (this.dialect.includes('mysql')) {
      return `\`${clean}\``;
    } else if (this.dialect.includes('postgres')) {
      return `"${clean}"`;
    } else {
      return `\`${clean}\``;
    }
  }

  query(tableName) {
    if (!this.queryManager) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.queryManager.table(this.literalTableName(tableName));
  }

  async raw(query, replacements = [], options = {}) {
    return await this.sequelize.query(query, {
      replacements,
      type: options.type || QueryTypes.RAW,
      transaction: options.transaction || this.transaction,
      ...options
    });
  }

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.escape(table) : this.escapeId(table);
  }

  literalTableName(document) {
    return `${this.tablePrefix}${document}`;
  }

  clearTableCache() {
    tableDescriptionCache.clear();
  }

  async close() {
    if (this._coreConnection) {
      await this._coreConnection.close();
      this._coreConnection = null;
    }
    
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }
    
    this.clearTableCache();
  }
}

setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tableDescriptionCache.entries()) {
    if (now - value.timestamp > TABLE_CACHE_TTL) {
      tableDescriptionCache.delete(key);
    }
  }
}, TABLE_CACHE_TTL);