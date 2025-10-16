import path from "pathe";
import { loopar, fileManage } from "loopar";
import BaseDocument from "../../../../../../core/document/base-document.js";

export default class Installer extends BaseDocument {
  async getDocumentData(document, root) {
    return await fileManage.getConfigFile(document, root);
  }

  getNameToFileName(name) {
    return loopar.utils.decamelize(name.replaceAll(/\s/g, ''), { separator: '-' });
  }

  checkIfAppExists() {
    return fileManage.existFileSync(loopar.makePath('apps', this.app_name, 'installer.js'));
  }

  async restartInstaller() {
    const installerRoute = loopar.makePath('apps', this.app_name, 'installer.js');

    if (fileManage.existFileSync(installerRoute)) {
      const InstallerModel = await fileManage.importClass(installerRoute);
      new InstallerModel(await this.values(true)).install();
    } else {
      loopar.throw(`App ${this.app_name} not provide a installer model`);
    }
  }

  async unInstall() {
    if (this.app_name === 'loopar') {
      loopar.throw("You can't uninstall app Loopar");
    }

    console.log("Uninstalling App", this.app_name);
    loopar.installingApp = this.app_name;

    const moduleRoute = loopar.makePath('apps', this.app_name);
    const appData = await fileManage.getConfigFile('installer', moduleRoute).documents;
    
    
    for (const e of Object.keys(appData).reverse()) {
      console.warn([`Uninstalling ${e}`]);
      const ent = appData[e];
      const [constructor, name] = e.split(':');

      if(ent.root){
        if(await loopar.db.hasEntity(constructor, name)){
          const entityData = await this.getDocumentData(name, ent.root);
          if(entityData && ent.app == this.app_name){
            const doc = await loopar.getDocument(constructor, name);
            console.warn([`Uninstalling ${constructor}:${name}`]);
            await doc.delete({ sofDelete: false, force: true, updateHistory: false });
          }else{
            console.log([`No data found for ${constructor}:${name}, skipping...`]);
          }
        }
      }else{
        if (await loopar.db.count(constructor, name)) {
          console.warn([`Deleting ${constructor}:${name}`]);
          const doc = await loopar.getDocument(constructor, name);
          await doc.delete({ sofDelete: false, force: true, updateHistory: false }); 
        }
      }
    }

    loopar.installingApp = null;
    await loopar.buildRefs();
    console.log(`App ${this.app_name} uninstalled successfully!`);
    return `App ${this.app_name} uninstalled successfully!`;
  }

  async clone(repo) {
    return new Promise((resolve, reject) => {
      console.log(["Cloning", repo]);

      loopar.git().clone(repo, async (err, update) => {
        err && loopar.throw(err);
        await loopar.rebuildVite();
        resolve(true);
      });
    });
  }

  async install(reinstall = false) {
    loopar.installingApp = this.app_name;
    console.log("Installing App", this.app_name);

    if (this.app_name === 'loopar') {
      if (!this.checkIfAppExists()) {
        await this.clone("https://github.com/alphabit-technology/loopar.git");
        await loopar.buildRefs();
        return await this.restartInstaller();
      }
    }

    await this.installData(reinstall);

    loopar.installingApp = null;
    const installedApps = fileManage.getConfigFile('installed-apps');
    installedApps[this.app_name] = true;
    await fileManage.setConfigFile('installed-apps', installedApps);
    
    await loopar.build();
    return "App installed successfully!";
  }
  
  async getAppFromModule(module) {
    return await loopar.db.getValue('Module', 'app_name', module, {ifNotFound: null});
  }

  async installData(reinstall = false) {
    console.log("Installing DATA", this.app_name);
    const moduleRoute = loopar.makePath('apps', this.app_name);
    const appData = await fileManage.getConfigFile('installer', moduleRoute).documents;

    for (const e of Object.keys(appData)) {
      const ent = appData[e];
      const [constructor, name] = e.split(':');

      if(ent.root){
        if(!await loopar.db.hasEntity(constructor, name)){
          if(ent.app == this.app_name){
            const entityData = await this.getDocumentData(name, ent.root);
            if(entityData){
              const doc = await loopar.newDocument(constructor, entityData);
              console.log(["Installing", constructor, name]);
              await doc.save({ validate: false });
            }else{
              console.log([`No data found for ${constructor}:${name}, skipping...`]);
            }
          }else{
            loopar.throw(`App ${this.app_name} require ${ent.app}:${ent.name} to be installed first`);
          }
        }
      }else{
        if (!await loopar.db.count(constructor, name)) {
          console.log([`Inserting ${constructor}:${name}`]);
          const doc = await loopar.newDocument(constructor, { ...ent, __document_status__: "Active" });
          await doc.save({ validate: false });
        } else if (reinstall) {
          console.log([`Updating ${constructor}:${name}`]);
          const doc = await loopar.getDocument(constructor, name, ent);
          await doc.save({ validate: false });
        }
      }
    }

    return `App ${this.app_name} installed successfully!`;
  }

  async pull(repo) {
    const exist = await loopar.db.getValue('App', "name", this.app_name, null, null);
    const appFile = fileManage.getConfigFile("installer", path.join("apps", this.app_name));

    loopar.validateGitRepository(this.app_name, repo || appFile.App[this.app_name].git_repo);

    if (!exist) {
      loopar.throw(`App ${this.app_name} is not installed, please install it first`);
      return;
    }

    return new Promise((resolve, reject) => {
      loopar.git(this.app_name).pull(async (err, update) => {
        err && loopar.throw(err);

        if (update && update.summary.changes) {
          await this.installData();
          resolve(true);
        } else {
          loopar.throw(`App ${this.app_name} is already updated`);
        }
      });
    });
  }
}