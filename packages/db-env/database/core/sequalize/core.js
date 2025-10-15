'use strict';
import { loopar, TYPES, elementsDict } from "loopar";
import { Sequelize, QueryTypes, DataTypes, Op } from '@sequelize/core';

function stringToSequelizeType(typeString, field) {
  const typeMap = {
      'increments': DataTypes.INTEGER,
      'INTEGER': DataTypes.INTEGER,
      'BIGINT': DataTypes.BIGINT,
      'FLOAT': DataTypes.FLOAT,
      'DECIMAL': DataTypes.DECIMAL(field?.data?.precision || 10, field?.data?.scale || 2),
      'DOUBLE': DataTypes.DOUBLE,
      'SMALLINT': DataTypes.SMALLINT,
      'TINYINT': DataTypes.TINYINT,
      'STRING': field?.data?.length ? DataTypes.STRING(field.data.length) : DataTypes.STRING,
      'TEXT': DataTypes.TEXT,
      'TEXT.medium': DataTypes.TEXT('medium'),
      'TEXT.long': DataTypes.TEXT('long'),
      'UUID': DataTypes.UUID,
      'ENUM': field?.data?.options ? DataTypes.ENUM(...field.data.options) : DataTypes.STRING,
      'BOOLEAN': DataTypes.BOOLEAN,
      'DATEONLY': DataTypes.DATEONLY,
      'DATE': DataTypes.DATE,
      'TIME': DataTypes.TIME,
      'BLOB': DataTypes.BLOB,
      'JSON': DataTypes.JSON,
      'JSONB': DataTypes.JSONB,
      'GEOMETRY': DataTypes.GEOMETRY,
      'GEOMETRY.POINT': DataTypes.GEOMETRY('POINT'),
      'GEOMETRY.MULTIPOINT': DataTypes.GEOMETRY('MULTIPOINT')
  };
  
  return typeMap[typeString] || DataTypes.STRING;
}

function escapeId(identifier, dialect) {
    if (!identifier) return '';
    
    const clean = identifier.replace(/[`'"]/g, '');
    
    if (dialect.includes('mysql')) {
      return `\`${clean}\``;
    } else if (dialect.includes('postgres')) {
      return `"${clean}"`;
    } else {
      return `\`${clean}\``;
    }
}

function getSequelizeType(field) {
    const element = field.element || 'input';
    const elementDef = elementsDict[element]?.def;
    
    let typeString = elementDef?.type || field.data?.format || TYPES.string;
    
    if (element === 'input' && field.data?.format) {
        typeString = field.data.format;
    }
    
    return stringToSequelizeType(typeString, field);
}

function sequelizeTypeToSQL(type, field, dialect) {
    const typeString = type?.toString() || 'STRING';
    
    if (typeString.includes('INTEGER')) return dialect.includes('mysql') ? 'INT' : 'INTEGER';
    if (typeString.includes('BIGINT')) return 'BIGINT';
    if (typeString.includes('FLOAT')) return 'FLOAT';
    if (typeString.includes('DOUBLE')) return 'DOUBLE';
    if (typeString.includes('DECIMAL')) {
      const precision = field?.data?.precision || 10;
      const scale = field?.data?.scale || 2;
      return `DECIMAL(${precision}, ${scale})`;
    }
    if (typeString.includes('STRING')) {
      const length = field?.data?.length || 255;
      return `VARCHAR(${length})`;
    }
    if (typeString.includes('TEXT')) {
      if (typeString.includes('medium')) return 'MEDIUMTEXT';
      if (typeString.includes('long')) return 'LONGTEXT';
      return 'TEXT';
    }
    if (typeString.includes('BOOLEAN')) {
      return dialect.includes('mysql') ? 'BOOLEAN' : 'INTEGER';
    }
    if (typeString.includes('DATEONLY')) return 'DATE';
    if (typeString.includes('DATE')) return dialect.includes('mysql') ? 'DATETIME' : 'TIMESTAMP';
    if (typeString.includes('TIME')) return 'TIME';
    if (typeString.includes('JSON')) {
      return (dialect.includes('mysql') || dialect.includes('postgres')) ? 'JSON' : 'TEXT';
    }
    if (typeString.includes('UUID')) {
      return dialect.includes('postgres') ? 'UUID' : 'VARCHAR(36)';
    }
    if (typeString.includes('BLOB')) return 'BLOB';
    if (typeString.includes('ENUM')) {
      if (field?.data?.options && (dialect.includes('mysql') || dialect.includes('postgres'))) {
        const values = field.data.options.map(o => `'${o}'`).join(', ');
        return `ENUM(${values})`;
      }
      return 'VARCHAR(255)';
    }
    
    return 'VARCHAR(255)';
}

function formatDefaultValue(value, field, dialect) {
    if (value === 'CURRENT_TIMESTAMP' || value === 'NOW()') {
        return 'CURRENT_TIMESTAMP';
    }
    
    const type = getSequelizeType(field);
    const typeString = type?.toString() || '';
    
    if (typeString.includes('INTEGER') || typeString.includes('FLOAT') || 
        typeString.includes('DOUBLE') || typeString.includes('DECIMAL')) {
        return value;
    }
    
    if (typeString.includes('BOOLEAN')) {
        if (dialect.includes('mysql')) {
            return value ? 'TRUE' : 'FALSE';
        }
        return value ? '1' : '0';
    }
    
    if (typeString.includes('JSON')) {
        return `'${JSON.stringify(value)}'`;
    }
    
    return `'${value.toString().replace(/'/g, "''")}'`;
}

function generateColumnSQL(field, action, dialect) {
    const data = field.data;
    const columnName = escapeId(data.name, dialect);
    
    // Manejo especial para ID con auto-increment
    if ((data.name === 'id' || field.element === 'id') && action === 'create') {
        if (dialect.includes('mysql')) {
            return `${columnName} INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`;
        } else if (dialect.includes('sqlite')) {
            return `${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`;
        } else if (dialect.includes('postgres')) {
            return `${columnName} SERIAL PRIMARY KEY`;
        }
    }
    
    const type = getSequelizeType(field);
    const sqlType = sequelizeTypeToSQL(type, field, dialect);
    let sql = `${columnName} ${sqlType}`;
    
    const constraints = [];
    
    if (data.required && data.name !== 'id') {
        constraints.push('NOT NULL');
    }
    
    if (data.default_value !== undefined && data.default_value !== null && data.default_value !== '') {
        const defaultValue = formatDefaultValue(data.default_value, field, dialect);
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

export default class Core {
  Op=Op;
  constructor(config = null) {
    this.customConfig = config;
    this.transactionStack = [];
  }

  get dbConfig() {
    return this.customConfig || env.dbConfig || {};
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
  }

  async hasTable(tableName) {
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
      
      return result && result.length > 0;
    } catch (error) {
      console.error('Error checking table existence:', error.message);
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
    
    await this.createTableIndexes(tableName, fields);
  }

  async alterTable(tableName, fields, existingFields) {
    const existingColumns = new Set(
      existingFields.map(f => f.name.toLowerCase())
    );
    
    const alterations = [];
    const newFields = [];
    
    const processField = (field) => {
      if (!fieldIsWritable(field)) return;
      
      const columnName = field.data.name.toLowerCase();
      
      if (!existingColumns.has(columnName)) {
        const columnSQL = generateColumnSQL(field, 'alter', this.dialect);
        alterations.push(`ADD COLUMN ${columnSQL}`);
        newFields.push(field);
      }
      
      if (field.elements && Array.isArray(field.elements)) {
        field.elements.forEach(processField);
      }
    };
    
    fields.forEach(processField);
    
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
      
      await this.createTableIndexes(tableName, newFields);
    }
  }

  escapeId(identifier) {
    return escapeId(identifier, this.dialect);
  }

  generateColumnsSQL(fields, action = 'create') {
    const columns = [];
    
    const processField = (field) => {
      if (fieldIsWritable(field)) {
        columns.push(generateColumnSQL(field, action, this.dialect));
      }
      
      if (field.elements && Array.isArray(field.elements)) {
        field.elements.forEach(processField);
      }
    };
    
    fields.forEach(processField);
    return columns;
  }

  generateIndexes(fields) {
    const indexes = [];
    
    for (const field of fields) {
      const data = field.data || {};
      
      if (this.dialect.includes('mysql')) {
        if (data.index && data.name !== 'id') {
          const indexName = `idx_${data.name}`;
          indexes.push(`INDEX ${indexName} (${this.escapeId(data.name)})`);
        }
        
        if (data.unique && data.name !== 'id') {
          const uniqueName = `uniq_${data.name}`;
          indexes.push(`UNIQUE INDEX ${uniqueName} (${this.escapeId(data.name)})`);
        }
      }
    }
    
    return indexes;
  }

  async createTableIndexes(tableName, fields) {
    if (this.dialect.includes('mysql')) {
      return;
    }
    
    const indexQueries = [];
    
    const processField = (field) => {
      if (!fieldIsWritable(field)) return;
      
      const data = field.data || {};
      
      if (data.index && data.name !== 'id') {
        const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
        const indexName = `idx_${safeTableName}_${data.name}`;
        const query = `CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName} (${this.escapeId(data.name)})`;
        indexQueries.push(query);
      }
      
      if (data.unique && data.name !== 'id') {
        const safeTableName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');
        const uniqueName = `uniq_${safeTableName}_${data.name}`;
        const query = `CREATE UNIQUE INDEX IF NOT EXISTS ${uniqueName} ON ${tableName} (${this.escapeId(data.name)})`;
        indexQueries.push(query);
      }
      
      if (field.elements && Array.isArray(field.elements)) {
        field.elements.forEach(processField);
      }
    };
    
    fields.forEach(processField);
    
    for (const query of indexQueries) {
      try {
        await this.sequelize.query(query, {
          type: QueryTypes.RAW,
          transaction: this.transaction
        });
      } catch (error) {
        console.error(`Error creating index: ${query}`, error);
      }
    }
  }

  async getTableDescription(document) {
    const tableName = this.literalTableName(document);

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
      
      return result.map(mapFunction);
    } catch (error) {
      console.error(`Error getting table description for ${tableName}:`, error.message);
      return [];
    }
  }

  escape(value) {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    
    if (Array.isArray(value) && value.length === 0) {
      return 'NULL';
    }
    
    if (typeof value === 'string' || 
        typeof value === 'number' || 
        typeof value === 'boolean' ||
        value instanceof Date ||
        (Array.isArray(value) && value.length > 0)) {
      return this.sequelize.escape(value);
    }
    
    return 'NULL';
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

  async close() {
    if (this._coreConnection) {
      await this._coreConnection.close();
      this._coreConnection = null;
    }
    
    if (this.sequelize) {
      await this.sequelize.close();
      this.sequelize = null;
    }
  }
}