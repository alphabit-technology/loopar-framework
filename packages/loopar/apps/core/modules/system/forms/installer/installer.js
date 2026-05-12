import path from "pathe";
import { loopar, fileManage } from "loopar";
import BaseDocument from "../../../../../../core/document/base-document.js";

function entryAppOwner(ent, entryKey) {
  if (ent.__app__ != null) return ent.__app__;
  if (ent.app != null) return ent.app;

  return null;
}

function entryRoot(ent, entryKey) {
  if (ent.__root__ != null) return ent.__root__;
  if (ent.root != null) return ent.root;
  
  return null;
}

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
        const entityData = await this.getDocumentData(name, entryRoot(ent, e));
        if(entityData){
          const doc = await loopar.getDocument(constructor, name);
          console.warn([`Uninstalling ${constructor}:${name}`]);
          await doc.delete({ sofDelete: false, force: true });
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
        await doc.delete({ sofDelete: false, force: true, build: false });
      }
    }

    for (const e of Object.keys(appData.documents).reverse()) {
      const ent = appData.documents[e];
      const owner = entryAppOwner(ent, e);
      if (owner && owner !== this.app_name) continue;

      if(entryRoot(ent, e)){
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
        if(!ent) continue;

        const owner = entryAppOwner(ent, e);
        if (owner && owner !== this.app_name) continue;

        if(entryRoot(ent, e)){
          await unInstallEntity(e, ent);
        }else{
          await unInstallDocument(e, ent);
        }
      }
    }

    await loopar.unsetApp(this.name);
    await loopar.buildRefs();
    console.log(`App ${this.app_name} uninstalled successfully!`);
    return `App ${this.app_name} uninstalled successfully!`;
  }

  async clone(repo) {
    return new Promise((resolve, reject) => {
      console.log(["Cloning", repo]);

      loopar.git().clone(repo, async (err, update) => {
        if(err) return reject(err);
        //await loopar.rebuildVite();
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
    await loopar.setApp({[this.app_name]: true});
    
    await loopar.build();
    console.log(`App ${this.app_name} installed successfully!`);
    return `App ${this.app_name} installed successfully!`;
  }
  
  async getAppFromModule(module) {
    return await loopar.db.getValue('Module', 'app_name', module, {ifNotFound: null});
  }

  async installData(reinstall = false) {
    const moduleRoute = loopar.makePath('apps', this.app_name);
    let appData = await fileManage.getConfigFile('installer', moduleRoute);

    if (reinstall) {
      await this.ensureFrameworkColumns();

      const fsEntities = new Set(
        loopar.getEntities(this.app_name).map(e => e.name)
      );

      const snapshotEntities = new Set(
        Object.entries(appData?.documents || {})
          .filter(([, v]) => v && (v.__root__ || v.root || v.doc || v.__app__ || v.app))
          .map(([k]) => k.split(':').slice(1).join(':'))
          .filter(Boolean)
      );
      const hasDrift = [...fsEntities].some(name => !snapshotEntities.has(name));

      if (hasDrift) {
        console.log(
          `[installer] installer.json is stale for "${this.app_name}" — regenerating snapshot before update`
        );
        const app = await loopar.getDocument("App", this.app_name);
        await app.buildInstaller();
        appData = await fileManage.getConfigFile('installer', moduleRoute);
      }
    }

    const installEntity = async (e, ent) => {
      const [constructor, name] = e.split(':');
      const exist = await loopar.db.hasEntity(constructor, name);
      const owner = entryAppOwner(ent, e);

      if(!owner || owner == this.app_name){
        const entityData = await this.getDocumentData(name, entryRoot(ent, e));
        if(entityData){
          const doc = exist ? await loopar.getDocument(constructor, name, entityData) : await loopar.newDocument(constructor, entityData);
          console.log([exist ? "Updating......." : "Installing.......", constructor, name]);
          (!exist || reinstall) && await doc.save({ validate: false, reload: false });
        }else{
          console.log([`No data found for ${constructor}:${name}, skipping...`]);
        }
      }else{
        loopar.throw(`App ${this.app_name} require ${owner}:${name} to be installed first`);
      }
    }

    const installDocument = async (e, ent, postInstall=false) => {
      const [constructor, name] = e.split(':');

      const { id: _ignoredSnapshotId, ...cleanEnt } = ent;

      if (!await loopar.db.count(constructor, name)) {
        console.log([`Inserting ${constructor}:${name}`]);
        const doc = await loopar.newDocument(constructor, { ...cleanEnt, __document_status__: "Active" });
        doc.name = name;
        await doc.save({ validate: false });
      } else if (reinstall || postInstall) {
        console.log([`Updating ${constructor}:${name}`]);
        const doc = await loopar.getDocument(constructor, name, cleanEnt);
        await doc.save({ validate: false, forceChildren: postInstall });
      }
    }

    for (const e of Object.keys(appData.documents)) {
      const ent = appData.documents[e];

      if (!ent || (typeof ent === 'object' && Object.keys(ent).length === 0)) continue;

      const owner = entryAppOwner(ent, e);
      if (owner && owner !== this.app_name) {
        const [constructor, name] = e.split(':');
        const exists = await loopar.db.count(constructor, name);
        if (exists) {
          console.log([`[installer] ${e} owned by "${owner}" — found in DB, ok`]);
        } else {
          loopar.throw(
            `App "${this.app_name}" requires "${owner}" to be installed first ` +
            `(missing dependency: ${e})`
          );
        }
        continue;
      }

      if(entryRoot(ent, e)){
        await installEntity(e, ent);
      }else{
        await installDocument(e, ent);
      }
    }

    if(appData.postInstaller){
      for(const e of Object.keys(appData.postInstaller)){
        let ent = appData.postInstaller[e];
        if(ent == 'link') ent = appData.documents[e];

        if(!ent) continue;

        const owner = entryAppOwner(ent, e);
        if (owner && owner !== this.app_name) continue;

        if(entryRoot(ent, e)){
          await installEntity(e, ent, true);
        }else{
          await installDocument(e, ent, true);
        }
      }
    }

    await this.ensureFrameworkColumns();

    const topLevelVersion = appData?.App?.version;
    if (topLevelVersion) {
      try {
        const installedApp = await loopar.getDocument("App", this.app_name, null, { ifNotFound: null });
        if (installedApp && installedApp.version !== topLevelVersion) {
          installedApp.version = topLevelVersion;
          await installedApp.save({ validate: false });
        }
      } catch (e) {
        console.warn(`[installer] could not sync App.version for ${this.app_name}:`, e.message);
      }
    }

    return `App ${this.app_name} installed successfully!`;
  }

  async ensureFrameworkColumns() {
    const entities = loopar
      .getEntities(this.app_name)
      .filter(e => !e.__deleted_at__)
      .filter(e => {
        const ref = loopar.getRef(e.name);
        if (!ref) return false;
        if (ref.is_static) return false;
        return true;
      });

    for (const entity of entities) {
      try {
        const ref = loopar.getRef(entity.name);
        await loopar.db.makeTable(entity.name, ref.__FIELDS_STRUCTURE__ || ref.doc_structure || []);
      } catch (e) {
        console.error(`[ensureFrameworkColumns] ${entity.name}:`, e.message);
      }
    }
  }

  async ensureAuditFields() {
    return this.ensureFrameworkColumns();
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
          await loopar.build();
          resolve(true);
        } else {
          loopar.throw(`App ${this.app_name} is already updated`);
        }
      });
    });
  }
}