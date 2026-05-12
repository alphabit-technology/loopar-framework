import { loopar, BaseDocument } from "loopar";

export default class Connector extends BaseDocument {
  async connect() {
    const values = await this.values(true);
    const dbConfig = loopar.getDbConfig();
    const originalConfig = dbConfig.connection || {};
    const dialect = values.dialect || values.database;
    
    const { dialect: _dialect, database: _legacyDialect, ...connectionValues } = values;

    Object.assign(dbConfig, {
      dialect,
      connection: Object.assign(originalConfig, connectionValues),
    });

    await loopar.setDbConfig(dbConfig);
    await loopar.db.initialize();

    if (await loopar.db.testServer()) {
      await loopar.initialize();
      return true;
    }

    loopar.throw({
      message: `Could not connect to the database server.<br><br>
        Check that the server is running, the credentials are correct,
        and (for remote servers) that the firewall allows the connection.`,
    });
  }
}
