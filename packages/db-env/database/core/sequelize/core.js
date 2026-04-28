'use strict';
import { loopar, TYPES, elementsDict } from "loopar";
import { Sequelize, QueryTypes, DataTypes, Op } from '@sequelize/core';
import { orphanManager } from "./orphan-manager.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NON_WRITABLE_ELEMENTS = new Set([
  'panel', 'tab', 'section', 'column', 'row', 'divider',
  'html', 'button', 'card', 'accordion', 'stepper',
]);

export function fieldIsWritable(field) {
  if (!field?.data?.name) return false;
  return !NON_WRITABLE_ELEMENTS.has(field.element || 'input');
}

function stringToSequelizeType(typeString, field) {
  const typeMap = {
    increments:            DataTypes.INTEGER,
    INTEGER:               DataTypes.INTEGER,
    BIGINT:                DataTypes.BIGINT,
    FLOAT:                 DataTypes.FLOAT,
    DECIMAL:               DataTypes.DECIMAL(field?.data?.precision || 10, field?.data?.scale || 2),
    DOUBLE:                DataTypes.DOUBLE,
    SMALLINT:              DataTypes.SMALLINT,
    TINYINT:               DataTypes.TINYINT,
    STRING:                field?.data?.length ? DataTypes.STRING(field.data.length) : DataTypes.STRING,
    TEXT:                  DataTypes.TEXT,
    'TEXT.medium':         DataTypes.TEXT('medium'),
    'TEXT.long':           DataTypes.TEXT('long'),
    UUID:                  DataTypes.UUID,
    ENUM:                  field?.data?.options ? DataTypes.ENUM(...field.data.options) : DataTypes.STRING,
    BOOLEAN:               DataTypes.BOOLEAN,
    DATEONLY:              DataTypes.DATEONLY,
    DATE:                  DataTypes.DATE,
    TIME:                  DataTypes.TIME,
    BLOB:                  DataTypes.BLOB,
    JSON:                  DataTypes.JSON,
    JSONB:                 DataTypes.JSONB,
    GEOMETRY:              DataTypes.GEOMETRY,
    'GEOMETRY.POINT':      DataTypes.GEOMETRY('POINT'),
    'GEOMETRY.MULTIPOINT': DataTypes.GEOMETRY('MULTIPOINT'),
  };
  return typeMap[typeString] || DataTypes.STRING;
}

function escapeId(identifier, dialect) {
  if (!identifier) return '';
  const clean = identifier.replace(/[`'"]/g, '');
  return dialect.includes('postgres') ? `"${clean}"` : `\`${clean}\``;
}

function getSequelizeType(field) {
  const element    = field.element || 'input';
  const elementDef = elementsDict[element]?.def;
  let typeString   = elementDef?.type || field.data?.format || TYPES.string;
  if (element === 'input' && field.data?.format) typeString = field.data.format;
  return stringToSequelizeType(typeString, field);
}

function sequelizeTypeToSQL(type, field, dialect) {
  const ts = type?.toString() || 'STRING';
  if (ts.includes('INTEGER')) return dialect.includes('mysql') ? 'INT' : 'INTEGER';
  if (ts.includes('BIGINT'))  return 'BIGINT';
  if (ts.includes('FLOAT'))   return 'FLOAT';
  if (ts.includes('DOUBLE'))  return 'DOUBLE';
  if (ts.includes('DECIMAL')) return `DECIMAL(${field?.data?.precision || 10}, ${field?.data?.scale || 2})`;
  if (ts.includes('STRING'))  return `VARCHAR(${field?.data?.length || 255})`;
  if (ts.includes('TEXT')) {
    if (ts.includes('medium')) return 'MEDIUMTEXT';
    if (ts.includes('long'))   return 'LONGTEXT';
    return 'TEXT';
  }
  if (ts.includes('BOOLEAN'))  return dialect.includes('mysql') ? 'BOOLEAN' : 'INTEGER';
  if (ts.includes('DATEONLY')) return 'DATE';
  if (ts.includes('DATE'))     return dialect.includes('mysql') ? 'DATETIME' : 'TIMESTAMP';
  if (ts.includes('TIME'))     return 'TIME';
  if (ts.includes('JSON'))     return (dialect.includes('mysql') || dialect.includes('postgres')) ? 'JSON' : 'TEXT';
  if (ts.includes('UUID'))     return dialect.includes('postgres') ? 'UUID' : 'VARCHAR(36)';
  if (ts.includes('BLOB'))     return 'BLOB';
  if (ts.includes('ENUM')) {
    if (field?.data?.options && (dialect.includes('mysql') || dialect.includes('postgres'))) {
      return `ENUM(${field.data.options.map(o => `'${o}'`).join(', ')})`;
    }
    return 'VARCHAR(255)';
  }
  return 'VARCHAR(255)';
}

function formatDefaultValue(value, field, dialect) {
  if (value === 'CURRENT_TIMESTAMP' || value === 'NOW()') return 'CURRENT_TIMESTAMP';
  const ts = getSequelizeType(field)?.toString() || '';
  if (['INTEGER', 'FLOAT', 'DOUBLE', 'DECIMAL'].some(t => ts.includes(t))) return value;
  if (ts.includes('BOOLEAN')) return dialect.includes('mysql') ? (value ? 'TRUE' : 'FALSE') : (value ? '1' : '0');
  if (ts.includes('JSON')) return `'${JSON.stringify(value)}'`;
  return `'${value.toString().replace(/'/g, "''")}'`;
}

function generateColumnSQL(field, action, dialect) {
  const data       = field.data;
  const columnName = escapeId(data.name, dialect);

  if ((data.name === 'id' || field.element === 'id') && action === 'create') {
    if (dialect.includes('mysql'))    return `${columnName} INT UNSIGNED AUTO_INCREMENT PRIMARY KEY`;
    if (dialect.includes('sqlite'))   return `${columnName} INTEGER PRIMARY KEY AUTOINCREMENT`;
    if (dialect.includes('postgres')) return `${columnName} SERIAL PRIMARY KEY`;
  }

  const sqlType     = sequelizeTypeToSQL(getSequelizeType(field), field, dialect);
  let   sql         = `${columnName} ${sqlType}`;
  const constraints = [];

  if (data.required && data.name !== 'id') constraints.push('NOT NULL');
  if (data.default_value !== undefined && data.default_value !== null && data.default_value !== '') {
    constraints.push(`DEFAULT ${formatDefaultValue(data.default_value, field, dialect)}`);
  }
  if (data.unique && action === 'create') constraints.push('UNIQUE');
  if (constraints.length) sql += ' ' + constraints.join(' ');

  return sql;
}

/**
 * Return a type-safe non-null default for a DB column that still carries
 * NOT NULL. Used by insertRow padding on SQLite orphan columns.
 *   numeric types → 0
 *   everything else → '' (always valid for TEXT / VARCHAR)
 */
export function safeDefaultForType(rawType) {
  const t = (rawType || '').toLowerCase();
  if (
    t.includes('int') || t.includes('float') || t.includes('double') ||
    t.includes('decimal') || t.includes('numeric') || t.includes('real') ||
    t.includes('bool')
  ) return 0;
  return '';
}

export default class Core {
  Op = Op;

  // Column metadata cache: Map<literalTableName, Map<colNameLower, columnMeta>>
  // Invalidated after any DDL (makeTable, drop, release).
  #tableColumnsCache = new Map();

  constructor(config = null) {
    this.customConfig     = config;
    this.transactionStack = [];
  }

  get dbConfig() { return loopar.getDbConfig(); }
  get database()  { return this.dbConfig.database; }

  // ---------------------------------------------------------------------------
  // Column cache — public so OrphanManager can call invalidateColumnsCache
  // ---------------------------------------------------------------------------

  /**
   * Return a Map<colNameLower, columnMeta> for the given logical document name.
   * Cached after the first call; invalidated by makeTable and orphan actions.
   */
  async getTableColumns(document) {
    const literalTable = this.literalTableName(document);
    if (this.#tableColumnsCache.has(literalTable)) {
      return this.#tableColumnsCache.get(literalTable);
    }
    const description = await this.getTableDescription(document);
    const colMap = new Map(description.map(f => [f.name.toLowerCase(), f]));
    this.#tableColumnsCache.set(literalTable, colMap);
    return colMap;
  }

  invalidateColumnsCache(document) {
    this.#tableColumnsCache.delete(this.literalTableName(document));
  }

  // ---------------------------------------------------------------------------
  // Orphan column API — thin wrappers that delegate to OrphanManager
  // ---------------------------------------------------------------------------

  /**
   * Return all orphan columns for a document (DB columns absent from structure).
   * @param {string} document  Logical document name, e.g. "Role"
   */
  async getOrphanColumns(document) {
    return orphanManager.getOrphanColumns(this, document);
  }

  /**
   * Strip blocking constraints (NOT NULL, DEFAULT, UNIQUE) from an orphan column.
   * Data is preserved; the column becomes fully permissive.
   */
  async releaseOrphanColumn(document, columnName) {
    return orphanManager.releaseOrphanColumn(this, document, columnName);
  }

  /**
   * Permanently drop an orphan column. Requires SQLite >= 3.35.
   * All associated indexes are dropped first.
   */
  async dropOrphanColumn(document, columnName) {
    return orphanManager.dropOrphanColumn(this, document, columnName);
  }

  /**
   * Re-add an orphan column to the Loopar field structure.
   * Does not modify the DB — only patches Entity metadata.
   */
  async restoreOrphanColumn(document, columnName) {
    return orphanManager.restoreOrphanColumn(this, document, columnName);
  }

  // ---------------------------------------------------------------------------
  // Schema management
  // ---------------------------------------------------------------------------

  async alterSchema() {
    if (this.dialect.includes('sqlite')) return;
    try {
      const q = this.dialect.includes('mysql')
        ? `CREATE DATABASE IF NOT EXISTS \`${this.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        : `CREATE DATABASE IF NOT EXISTS "${this.database}"`;
      await this.coreConnection.query(q, { type: QueryTypes.RAW });
    } catch (e) { console.error('Database creation error:', e.message); throw e; }
  }

  async dropSchema(schema) {
    const PROTECTED = new Set(['information_schema', 'mysql', 'postgres', 'template0', 'template1']);
    if (!schema || PROTECTED.has(schema)) throw new Error(`Cannot drop protected database: ${schema}`);
    try {
      const q = this.dialect.includes('mysql')
        ? `DROP DATABASE IF EXISTS \`${schema}\``
        : `DROP DATABASE IF EXISTS "${schema}"`;
      await this.coreConnection.query(q, { type: QueryTypes.RAW });
    } catch (e) { console.error('Database drop error:', e.message); throw e; }
  }

  async beginTransaction() {
    if (this.transaction) throw new Error('Transaction already active');
    this.transaction = await this.sequelize.startUnmanagedTransaction();
    return this.transaction;
  }

  async safeRollback() {
    if (!this.transaction) return;
    try   { await this.transaction.rollback(); }
    catch (e) { console.error('Rollback failed:', e.message); }
    finally   { this.transaction = null; }
  }

  async endTransaction() {
    if (!this.transaction) return;
    try   { await this.transaction.commit(); }
    catch (e) { console.error('Commit failed:', e.message); await this.safeRollback(); throw e; }
    finally   { this.transaction = null; }
  }

  async rollbackTransaction() { await this.safeRollback(); }

  throw(error) {
    if (this.transaction) this.rollbackTransaction().catch(console.error);
    loopar.throw(error);
  }

  get dialect() { return this.dbConfig.dialect || ""; }

  get masterSchema() {
    const map = {
      sqlite:   "sqlite_master",
      mysql:    "INFORMATION_SCHEMA.TABLES",
      postgres: "information_schema.tables",
      mssql:    "INFORMATION_SCHEMA.TABLES",
      oracle:   "user_tables",
    };
    const key = this.dialect.split(':')[0];
    if (!map[key]) throw new Error(`Database dialect not supported: ${key}`);
    return map[key];
  }

  async makeTable(name, fields) {
    this.invalidateColumnsCache(name);
    const exists = await this.hasTable(name);
    if (exists) {
      const dbFields = await this.getTableDescription(name);
      await this.alterTable(this.tableName(name), fields, dbFields);
    } else {
      await this.createTable(this.tableName(name), fields);
    }
    this.invalidateColumnsCache(name);
  }

  async hasTable(tableName) {
    tableName = this.literalTableName(tableName);
    try {
      let query, replacements;
      if (this.dialect.includes('mysql')) {
        query        = `SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? LIMIT 1`;
        replacements = [this.database, tableName];
      } else if (this.dialect.includes('sqlite')) {
        query        = `SELECT name FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1`;
        replacements = [tableName];
      } else {
        query        = `SELECT 1 FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ? LIMIT 1`;
        replacements = [tableName];
      }
      const result = await this.sequelize.query(query, { replacements, type: QueryTypes.SELECT });
      return result && result.length > 0;
    } catch (e) {
      console.error('Error checking table existence:', e.message);
      return false;
    }
  }

  async createTable(tableName, fields) {
    const columns = this.generateColumnsSQL(fields, 'create');
    const indexes = this.generateIndexes(fields);

    let sql = `CREATE TABLE IF NOT EXISTS ${tableName} (${columns.join(', ')}`;
    if (indexes.length) sql += `, ${indexes.join(', ')}`;
    sql += ')';
    if (this.dialect.includes('mysql')) sql += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

    await this.sequelize.query(sql, { type: QueryTypes.RAW, transaction: this.transaction });
    await this.createTableIndexes(tableName, fields);
  }

  async alterTable(tableName, fields, existingFields) {
    const existingColumns = new Set(existingFields.map(f => f.name.toLowerCase()));
    const alterations = [];
    const newFields   = [];

    const collectNew = (field) => {
      if (fieldIsWritable(field) && !existingColumns.has(field.data.name.toLowerCase())) {
        alterations.push(`ADD COLUMN ${generateColumnSQL(field, 'alter', this.dialect)}`);
        newFields.push(field);
      }
      field.elements?.forEach(collectNew);
    };
    fields.forEach(collectNew);

    if (alterations.length) {
      if (this.dialect.includes('mysql')) {
        await this.sequelize.query(
          `ALTER TABLE ${tableName} ${alterations.join(', ')}`,
          { type: QueryTypes.RAW, transaction: this.transaction }
        );
      } else {
        for (const alt of alterations) {
          await this.sequelize.query(`ALTER TABLE ${tableName} ${alt}`, {
            type: QueryTypes.RAW, transaction: this.transaction,
          });
        }
      }
      await this.createTableIndexes(tableName, newFields);
    }

    await this.reconcileOrphanColumns(tableName, fields, existingFields);
  }

  /**
   * Best-effort schema cleanup for orphan columns detected during alterTable.
   * Delegates to OrphanManager.reconcile() which uses the dialect-aware
   * dropColumnIndexes (including sqlite_master lookup for SQLite).
   */
  async reconcileOrphanColumns(tableName, fields, existingFields) {
    const structureCols = new Set();
    const collect = (field) => {
      if (fieldIsWritable(field)) structureCols.add(field.data.name.toLowerCase());
      field.elements?.forEach(collect);
    };
    fields.forEach(collect);

    const IMMUNE  = new Set(['id', 'name', '__document_status__']);
    const orphans = existingFields.filter(
      f => !structureCols.has(f.name.toLowerCase()) && !IMMUNE.has(f.name.toLowerCase())
    );

    if (!orphans.length) return;

    console.log([
      `[reconcileOrphanColumns] ${orphans.length} orphan(s) in ${tableName}:`,
      orphans.map(o => o.name),
    ]);

    await orphanManager.reconcile(this, tableName, orphans);
  }

  escapeId(identifier) { return escapeId(identifier, this.dialect); }

  generateColumnsSQL(fields, action = 'create') {
    const columns = [];
    const process = (field) => {
      if (fieldIsWritable(field)) columns.push(generateColumnSQL(field, action, this.dialect));
      field.elements?.forEach(process);
    };
    fields.forEach(process);
    return columns;
  }

  generateIndexes(fields) {
    if (!this.dialect.includes('mysql')) return [];
    const indexes = [];
    for (const field of fields) {
      const data = field.data || {};
      if (data.name === 'id') continue;
      if (data.index)  indexes.push(`INDEX idx_${data.name} (${this.escapeId(data.name)})`);
      if (data.unique) indexes.push(`UNIQUE INDEX uniq_${data.name} (${this.escapeId(data.name)})`);
    }
    return indexes;
  }

  async createTableIndexes(tableName, fields) {
    if (this.dialect.includes('mysql')) return;

    const process = async (field) => {
      if (!fieldIsWritable(field)) return;
      const data     = field.data || {};
      if (data.name === 'id') return;
      const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '_');

      if (data.index) {
        try {
          await this.sequelize.query(
            `CREATE INDEX IF NOT EXISTS idx_${safeName}_${data.name} ON ${tableName} (${this.escapeId(data.name)})`,
            { type: QueryTypes.RAW, transaction: this.transaction }
          );
        } catch (e) { console.error(`Error creating index for ${data.name}:`, e); }
      }
      if (data.unique) {
        try {
          await this.sequelize.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS uniq_${safeName}_${data.name} ON ${tableName} (${this.escapeId(data.name)})`,
            { type: QueryTypes.RAW, transaction: this.transaction }
          );
        } catch (e) { console.error(`Error creating unique index for ${data.name}:`, e); }
      }
      for (const child of field.elements || []) await process(child);
    };

    for (const field of fields) await process(field);
  }

  async getTableDescription(document) {
    const tableName = this.literalTableName(document);
    let query, mapFn;

    if (this.dialect.includes('sqlite')) {
      query = `PRAGMA table_info('${tableName}')`;
      mapFn = r => ({ name: r.name, type: r.type, nullable: !r.notnull, default: r.dflt_value, primary: r.pk === 1 });
    } else if (this.dialect.includes('mysql')) {
      query = `DESCRIBE \`${tableName}\``;
      mapFn = r => ({ name: r.Field, type: r.Type, nullable: r.Null === 'YES', default: r.Default, primary: r.Key === 'PRI' });
    } else {
      query = `SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = '${tableName}'`;
      mapFn = r => ({ name: r.column_name, type: r.data_type, nullable: r.is_nullable === 'YES', default: r.column_default, primary: false });
    }

    try {
      const result = await this.sequelize.query(query, { type: QueryTypes.SELECT });
      return result.map(mapFn);
    } catch (e) {
      console.error(`Error getting table description for ${tableName}:`, e.message);
      return [];
    }
  }

  escape(value) {
    if (value === null || value === undefined)  return 'NULL';
    if (Array.isArray(value) && !value.length) return 'NULL';
    if (
      typeof value === 'string'  || typeof value === 'number' ||
      typeof value === 'boolean' || value instanceof Date     ||
      (Array.isArray(value) && value.length)
    ) return this.sequelize.escape(value);
    return 'NULL';
  }

  query(tableName) {
    if (!this.queryManager) throw new Error('Database not initialized. Call initialize() first.');
    return this.queryManager.table(this.literalTableName(tableName));
  }

  async raw(query, replacements = [], options = {}) {
    return await this.sequelize.query(query, {
      replacements,
      type: options.type || QueryTypes.RAW,
      transaction: options.transaction || this.transaction,
      ...options,
    });
  }

  tableName(document, likeParam = false) {
    const table = `${this.tablePrefix}${document}`;
    return likeParam ? this.escape(table) : this.escapeId(table);
  }

  literalTableName(document) { return `${this.tablePrefix}${document}`; }

  async close() {
    if (this._coreConnection) { await this._coreConnection.close(); this._coreConnection = null; }
    if (this.sequelize)       { await this.sequelize.close();       this.sequelize = null; }
  }
}