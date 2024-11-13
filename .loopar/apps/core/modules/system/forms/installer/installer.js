import path from "path";
import { loopar, fileManage } from "loopar";
import BaseDocument from "../../../../../../core/document/base-document.js";

export default class Installer extends BaseDocument {
  async getDocumentData(document) {
    const ref = loopar.getRef(document);

    return await fileManage.getConfigFile(document, ref.__ROOT__);
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
      new InstallerModel(await this.values()).install();
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
    const ownEntities = loopar.getEntities(this.app_name);
    const ownEntitiesNames = ownEntities.map(e => e.name);

    const deleteDocuments = async (entity) => {
      const deleteDocument = async (ent, document) => {
        if (document.__document_status__ === "Deleted") return;
        if (!await loopar.db.count(ent.name, document.name)) return;

        await deleteDocuments(document);

        if (document.path && !ownEntitiesNames.includes(document.name)) return;

        console.warn("Uninstalling:", ent.name, document.name);
        await loopar.deleteDocument(ent.name, document.name, { updateInstaller: true, sofDelete: false, force: true, updateHistory: false });
      }

      for (const document of (entity.documents || []).sort((a, b) => b.id - a.id)) {
        await deleteDocument(entity, document);
      }
    }

    for (const entity of appData.documents) {
      await deleteDocuments(entity);
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

  async install() {
    loopar.installingApp = this.app_name;
    console.log("Installing App", this.app_name);

    if (this.app_name === 'loopar') {
      if (!this.checkIfAppExists()) {
        await this.clone("https://github.com/alphabit-technology/loopar.git");
        await loopar.buildRefs();
        this.restartInstaller();
        return;
      }
    }

    await this.installData();

    loopar.installingApp = null;
    const installedApps = fileManage.getConfigFile('installed-apps');
    installedApps[this.app_name] = true;
    await fileManage.setConfigFile('installed-apps', installedApps);
    
    await loopar.build();
    return "App installed successfully!";
  }

  /*getAppFromData(data, modu) {
    const modules = data.Module.documents;
    return Object.values(modules).find(e => e.name === modu).app_name;
  }*/

  async installData() {
    console.log("Installing App DATA", this.app_name);
    const moduleRoute = loopar.makePath('apps', this.app_name);
    const appData = (await fileManage.getConfigFile('installer', moduleRoute)).documents;
    const ownEntities = loopar.getEntities(this.app_name);

    const buildEntity = async (entity, data) => {
      if (!ownEntities.find(e => e.name === data.name)) return;

      const E = await loopar.newDocument(entity, data);
      await E.save({ save: false, validate: false });
    }

    const insertDocuments = async (entity) => {
      const insertDocument = async (ent, document) => {
        for (const req of (document.requires || [])) {
          const ref = loopar.getRef(document.name);

          if (ref) {
            for (const doc of (req.documents || [])) {
              await buildEntity(ref.__ENTITY__, doc);
            }
          } else {
            await insertDocuments(req);
          }
        }

       
        const data = document.path ? await fileManage.getConfigFile(document.name, document.path) : document.data;

        console.log(["Inserting Document", ent.name, document.name])
        if (!data) return;
        if (data.__document_status__ && data.__document_status__ === "Deleted") return;

        if (!await loopar.db.count(ent.name, document.name)) {
          const doc = await loopar.newDocument(ent.name, { ...data, __document_status__: "Active" });
          await doc.save({ validate: false });
        }

        for (const child of (document.documents || [])) {
          await insertDocument(document, child);
        }
      }

      const ref = loopar.getRef(entity.name);
      if (ref) {
        const data = await fileManage.getConfigFile(ref.__NAME__, ref.__ROOT__);
        await buildEntity(ref.__ENTITY__, data);
      }

      for (const document of (entity.documents || []).sort((a, b) => a.id - b.id)) {
        console.log(["Inserting Document", entity.name, document.name])
        await insertDocument(entity, document);
      }
    }

    for (const entity of appData) {
      await insertDocuments(entity);
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