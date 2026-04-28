import { loopar, fileManage } from "loopar";
import Core from "./core.js";
import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import { MySqlDialect } from '@sequelize/mysql';
import { SequelizeQueryManager } from './query-builder.js';

export default class Connector extends Core {
  async connectWithSqlite() {
    try {
      await fileManage.makeFolder("sites", loopar.tenantId, "database");
      const dbPath = loopar.makePath(
        loopar.pathRoot, "sites", loopar.tenantId, 'database', `${loopar.tenantId}.sqlite`
      );

      this.sequelize = new Sequelize({
        dialect: SqliteDialect,
        storage: dbPath,
        logging: false,
      });
    } catch (e) {
      loopar.throw("SQLite database not possible to connect");
    }
  }

  async connectMySQL(database = null) {
    const dbConfig = this.dbConfig;
    const connection = dbConfig.connection || {};

    try {
      this.sequelize = new Sequelize(
        database || dbConfig.database,
        connection.user || dbConfig.user,
        connection.password || dbConfig.password,
        {
          host: connection.host || dbConfig.host || 'localhost',
          port: connection.port || dbConfig.port || 3306,
          dialect: MySqlDialect,
          logging: false,
          pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
          },
          ...dbConfig.options,
        }
      );

      await this.sequelize.authenticate();
    } catch (e) {
      if (!database) {
        // Retry connecting through information_schema to run DDL (CREATE DATABASE)
        await this.connectMySQL("information_schema");
      } else {
        // Fall back to SQLite and surface the original error
        await this.connectWithSqlite();
        loopar.throw("MySQL database not possible to connect, falling back to SQLite");
      }
    }
  }

  get coreConnection() {
    if (this.dialect.includes('sqlite')) return this.sequelize;

    if (!this._coreConnection) {
      this._coreConnection = new Sequelize({
        ...this.dbConfig,
        pool: { max: 2, min: 0 },
      });
    }

    return this._coreConnection;
  }

  async #initialize() {
    const dialect = this.dbConfig.dialect || "";

    if (dialect.includes('sqlite')) {
      await this.connectWithSqlite();
      return;
    }

    if (dialect.includes('mysql') || dialect.includes('mariadb')) {
      await this.connectMySQL();
      return;
    }

    // Unknown dialect — fall back to SQLite so the app can still boot
    console.warn(`[Connector] Unsupported dialect "${dialect}", falling back to SQLite`);
    await this.connectWithSqlite();
  }

  async initialize() {
    await this.#initialize();
    this.queryManager = new SequelizeQueryManager(this.sequelize);
  }

  /**
   * Verify that the configured database exists on the server.
   * Returns true for SQLite (file-based, always "exists" after connectWithSqlite).
   */
  async testDatabase() {
    if (this.dialect.includes('sqlite')) return true;

    try {
      let query, replacements;

      if (this.dialect.includes('mysql') || this.dialect.includes('mariadb')) {
        query = `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`;
        replacements = [this.database];
      } else if (this.dialect.includes('postgres')) {
        query = `SELECT datname FROM pg_database WHERE datname = ?`;
        replacements = [this.database];
      } else {
        throw new Error(`Cannot verify database existence for dialect: ${this.dialect}`);
      }

      const result = await this.sequelize.query(query, {
        replacements,
        type: Sequelize.QueryTypes.SELECT,
      });

      const exists = result.length > 0;

      if (exists) {
        loopar.printSuccess('Database connected successfully');
      } else {
        loopar.printError(`Database "${this.database}" does not exist on the server`);
      }

      return exists;
    } catch (e) {
      loopar.printError('Database connection test failed: ' + e.message);
      return false;
    }
  }

  async testServer() {
    try {
      await this.coreConnection.query('SELECT 1+1 as result', {
        type: Sequelize.QueryTypes.SELECT,
      });
      loopar.printSuccess('\nDatabase server is running\n');
      return true;
    } catch (e) {
      console.error(["Database Server Error", e]);
      loopar.printError('\nDatabase server is not running\n');
      return false;
    }
  }

  async testFramework(app) {
    if (!loopar.DBServerInitialized || !loopar.DBInitialized) {
      loopar.printError(`Loopar framework is not installed`);
      return false;
    }

    const entities = loopar.getEntities(app).filter(e => e.__document_status__ !== 'Deleted');
    if (entities.length === 0) return false;

    const testFields = async (entityName, columns) => {
      try {
        const qi = this.sequelize
          .queryInterface
          .quoteIdentifier.bind(this.sequelize.queryInterface);

        const escapedColumns = columns.map(qi).join(', ');
        await this.sequelize.query(
          `SELECT ${escapedColumns} FROM ${this.tableName(entityName)} WHERE 1=2`,
          { type: Sequelize.QueryTypes.SELECT }
        );
        return true;
      } catch (error) {
        console.error(['Failed to test fields for', entityName, ':', error.message]);
        return false;
      }
    };

    for (const entity of entities) {
      const ref = loopar.getRef(entity.name);
      if (ref.is_single || ref.is_builder) continue;

      const exists = await this.hasTable(entity.name);
      const fieldsOk = await testFields(entity.name, ref.__FIELDS__);

      if (!exists || !fieldsOk) {
        loopar.printError(`Loopar framework is not installed (failed on: ${entity.name})`);
        return false;
      }
    }

    loopar.printSuccess(`Loopar framework is installed`);
    return true;
  }
}