import { loopar, fileManage } from "loopar";
import Core from "./core.js";
import knex from 'knex';

export default class Connector extends Core {
  async connectWithSqlite() {
    try {
      await fileManage.makeFolder('', "path/to");
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

    const testFields = async (entity, columns) => {
      try {
        await this.knex(this.literalTableName(entity)).whereRaw("1=2").select([...columns]);
        return true;
      } catch (error) {
        return false;
      }
    }

    for (const entity of entities) {
      const ref = loopar.getRef(entity.name);
      if (ref.is_single || ref.is_builder) continue;

      const exist = await this.knex.schema.hasTable(this.literalTableName(entity.name));
      const fieldsIsCorrect = await testFields(entity.name, ref.__FIELDS__);

      if (!exist || !fieldsIsCorrect) {
        loopar.printError(`Loopar framework is not installed`);
        return false;
      }
    }

    loopar.printSuccess(`Loopar framework is installed`);
    return true;
  }
}