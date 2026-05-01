import { loopar, CoreInstaller, fileManage } from "loopar";
import sha1 from "sha1";

export default class Installer extends CoreInstaller {
  module = "core";
  /**
   * snake_case because is the same property name in the database
   */
  app_name = "loopar";

  async validate() {
    if(this.admin_password !== this.confirm_password){
      loopar.throw("Passwords do not match");
    }

    /*if(this.admin_password.length < 8){
      loopar.throw("Password must be at least 8 characters long");
    }*/

    if(this.company.length < 3){
      loopar.throw("Company name must be at least 3 characters long");
    }

    if(this.email.length < 3){
      loopar.throw("Email must be at least 3 characters long");
    }

   /* if(this.admin_password === "admin"){
      loopar.throw("Password cannot be 'admin'");
    }

    if(this.email === "admin"){
      loopar.throw("Email cannot be 'admin'");
    }*/

    if(this.company === "admin"){
      loopar.throw("Company name cannot be 'admin'");
    }

    return await super.validate();
  }

  async install(reinstall = false) {
    if(reinstall) return super.install(true);
    await this.validate(reinstall);
    
    console.log("Installing Loopar");
    loopar.installingApp = "loopar";
    await this.setDbConfig();
    console.log("DB Config set");
    await loopar.db.initialize(true);
    console.log("DB Initialized");
    await loopar.db.alterSchema();
    console.log("Schema Altered");
    await this.#makeCoreTable();
    console.log("Core Table Created");
    await super.install();
    return await this.insertAdministratorUser();
  }

  async insertAdministratorUser() {
    let user = null
    if (await loopar.db.getValue("User", 'name', "Administrator", { ifNotFound: false })){
      user = await loopar.getDocument("User", "Administrator");
    }else{
      user = await loopar.newDocument("User");
    }

    user.name = "Administrator";
    user.email = this.email;
    user.password = this.admin_password;
    user.confirm_password = this.confirm_password;
    user.__document_status__ = "Active";

    console.log(["Creating Administrator User", this.admin_password]);
    await user.save({validate: false});
    console.log(["Administrator User Created successfully"]);
    return true;
  }

  async setDbConfig() {
    const db_config = fileManage.getConfigFile('db.config');
    db_config.database = 'db_' + sha1(this.company + new Date().toISOString()).substring(0, 16);
    env.dbConfig = db_config;
    return await fileManage.setConfigFile('db.config', db_config);
  }

  async #makeCoreTable() {
    const ref = loopar.getRef("Entity");
    const coreData = await this.getDocumentData("Entity", ref.__ROOT__);

    const Entity = await loopar.newDocument("Entity", coreData);
    await Entity.initialize({ validate: false });
  }
}