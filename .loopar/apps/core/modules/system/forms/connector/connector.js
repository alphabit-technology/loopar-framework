import { loopar, fileManage, BaseDocument } from "loopar";

export default class Connector extends BaseDocument {
  async connect() {
    const values = await this.values();
    const dbConfig = await fileManage.getConfigFile('db.config');
    const originalConfig = dbConfig.connection || {};

    Object.assign(dbConfig, {
      dialect: values.database,
      connection: Object.assign(originalConfig, values)
    });

    await fileManage.setConfigFile('db.config', dbConfig);

    env.dbConfig = dbConfig;
    await loopar.db.initialize();

    if (await loopar.db.testServer()) {
      await loopar.initialize();
      return true;
    } else {
      loopar.throw({
        message: `Could not connect to the database server<br><br>
If you are using a remote server, check that your firewall is configured properly.<br><br>
If you are using a local server, check that your server is running and that your credentials are correct.`
      });
    }
  }
}