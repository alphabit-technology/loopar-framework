import { loopar, fileManage } from "loopar";
import Core from "./core.js";
import { Sequelize } from '@sequelize/core';
import { SqliteDialect } from '@sequelize/sqlite3';
import { MySqlDialect } from '@sequelize/mysql';
import { MariaDbDialect } from '@sequelize/mariadb';

export default class Connector extends Core {
  async connectWithSqlite() {
    try {
      await fileManage.makeFolder('', "path/to");
      const dbPath = loopar.makePath(loopar.pathRoot, 'path/to', `${this.database}.sqlite`);

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
            idle: 10000
          },
          ...dbConfig.options
        }
      );

      await this.sequelize.authenticate();
    } catch (e) {
      if (!database) {
        await this.connectMySQL("information_schema");
      } else {
        await this.connectWithSqlite();
        loopar.throw("MySQL database not possible to connect, connecting to SQLite database");
      }
    }
  }

  async testDatabase() {
    const dialect = this.dialect;
    
    async function databaseExists(sequelize, dbName) {
      if (dialect.icludes('mysql')) {
        const result = await sequelize.query(
          `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?`, 
          {
            replacements: [dbName],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        return result.length > 0;
      } else if (dialect === 'postgres' || dialect === 'pg') {
        const result = await sequelize.query(
          `SELECT datname FROM pg_database WHERE datname = ?`, 
          {
            replacements: [dbName],
            type: Sequelize.QueryTypes.SELECT
          }
        );
        return result.length > 0;
      } else {
        throw new Error(`Cannot verify existence of database for dialect: ${dialect}`);
      }
    }

    if (dialect.includes('sqlite')) {
      return true;
    }

    try {
      await databaseExists(this.sequelize, this.database);
      loopar.printSuccess('Database connected successfully');
      return true;
    } catch (e) {
      loopar.printError('Database not connected');
      return false;
    }
  }

  async testServer() {
    try {
      await this.coreConnection.query('SELECT 1+1 as result', {
        type: Sequelize.QueryTypes.SELECT
      });
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

    const testFields = async (entity, columns) => {
      try {
        const columnList = columns.join(', ');
        await this.sequelize.query(
          `SELECT ${columnList} FROM ${this.tableName(entity)} WHERE 1=2`, 
          {
            type: Sequelize.QueryTypes.SELECT
          }
        );
        return true;
      } catch (error) {
        return false;
      }
    }

    for (const entity of entities) {
      const ref = loopar.getRef(entity.name);
      if (ref.is_single || ref.is_builder) continue;

      const exist = await this.hasTable(this.literalTableName(entity.name));
      const fieldsIsCorrect = await testFields(entity.name, ref.__FIELDS__);

      if (!exist || !fieldsIsCorrect) {
        loopar.printError(`Loopar framework is not installed...`);
        return false;
      }
    }

    loopar.printSuccess(`Loopar framework is installed`);
    return true;
  }
}