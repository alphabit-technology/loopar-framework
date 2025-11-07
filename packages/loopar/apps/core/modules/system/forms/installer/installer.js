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
    const appData = await fileManage.getConfigFile('installer', moduleRoute);

    const unInstallEntity = async (e, ent) => {
      const [constructor, name] = e.split(':');

      if(await loopar.db.hasEntity(constructor, name)){
        const entityData = await this.getDocumentData(name, ent.root);
        if(entityData){
          const doc = await loopar.getDocument(constructor, name);
          console.warn([`Uninstalling ${constructor}:${name}`]);
          await doc.delete({ sofDelete: false, force: true, updateHistory: false });
        }else{
          console.log([`No data found for ${constructor}:${name}, skipping...`]);
        }
      }
    }

    const unInstallDocument = async (e, ent) => {
      const [constructor, name] = e.split(':');
      if (constructor !== "Module Group" && await loopar.db.count(constructor, name)) {
        console.warn([`Deleting ${constructor}:${name}`]);
        const doc = await loopar.getDocument(constructor, name);
        await doc.delete({ sofDelete: false, force: true, updateHistory: false }); 
      }
    }

    for (const e of Object.keys(appData.documents).reverse()) {
      const ent = appData.documents[e];
      if(ent.app && ent.app != this.app_name) continue;

      if(ent.root){
        await unInstallEntity(e, ent);
      }else{
        await unInstallDocument(e, ent);
      }
    }

    loopar.installingApp = null;

    if(appData.postInstaller){
      for(const e of Object.keys(appData.postInstaller)){
        let ent = appData.postInstaller[e];
        if(ent == 'link') ent = appData.documents[e];

        if(ent.app && ent.app != this.app_name) continue;

        if(ent.root){
          await unInstallEntity(e, ent);
        }else{
          await unInstallDocument(e, ent);
        }
      }
    }

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
    const moduleRoute = loopar.makePath('apps', this.app_name);
    const appData = await fileManage.getConfigFile('installer', moduleRoute);

    const installEntity = async (e, ent) => {
      const [constructor, name] = e.split(':');

      if(!await loopar.db.hasEntity(constructor, name)){
        if(!ent.app || ent.app == this.app_name){
          const entityData = await this.getDocumentData(name, ent.root);
          if(entityData){
            const doc = await loopar.newDocument(constructor, entityData);
            console.log(["Installing...........", constructor, name]);
            await doc.save({ validate: false });
          }else{
            console.log([`No data found for ${constructor}:${name}, skipping...`]);
          }
        }else{
          loopar.throw(`App ${this.app_name} require ${ent.app}:${ent.name} to be installed first`);
        }
      }
    }

    const installDocument = async (e, ent, postInstall=false) => {
      const [constructor, name] = e.split(':');

      if (!await loopar.db.count(constructor, name)) {
        console.log([`Inserting ${constructor}:${name}`]);
        const doc = await loopar.newDocument(constructor, { ...ent, __document_status__: "Active" });
        await doc.save({ validate: false });
      } else if (reinstall || postInstall) {
        console.log([`Updating ${constructor}:${name}`]);
        const doc = await loopar.getDocument(constructor, name, ent);
        await doc.save({ validate: false });
      }
    }

    for (const e of Object.keys(appData.documents)) {
      const ent = appData.documents[e];
      
      if(ent.root){
        await installEntity(e, ent);
      }else{
        await installDocument(e, ent);
      }
    }
  
    loopar.installingApp = null;
    if(appData.postInstaller){
      for(const e of Object.keys(appData.postInstaller)){
        let ent = appData.postInstaller[e];
        if(ent == 'link') ent = appData.documents[e];
        
        if(ent.root){
          await installEntity(e, ent, true);
        }else{
          await installDocument(e, ent, true);
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