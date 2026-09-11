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
  /**
   * Roles an app declares, seeded (idempotently: only missing rows are
   * inserted, an admin's later edits are kept) after every install/update.
   *
   *   static roles = [
   *     { name: '<AppName> Manager', description: '…', is_system_role: 1,
   *       grants: [{ document: 'App:<AppName>', action: '*' }] },
   *     // extend a role owned by another app (e.g. the base "Web User"):
   *     { name: 'Web User', grants: [{ document: '<Page Name>, action: 'view', scope: 'own' }] },
   *   ];
   *
   * Grant: { document, action, scope = 'all' | 'own', deny = 0 }.
   * `document` may be an entity, '*', 'App:<app>' (every document of the
   * app, including ones added later) or 'Module:<module>' (sidebar).
   */
  static roles = [];

  /**
   * Convention — every app gets two roles without declaring anything:
   *   "<App> Manager": everything in the app, nothing else of the system.
   *   "<App> User":    reads everything in the app (view/list/search — so
   *                    selects and catalogs work), writes only its own
   *                    records (create/update/delete… with scope 'own').
   * The admin then widens or narrows per document in the permission manager.
   * Declared `static roles` are added on top; one with the same name replaces
   * the default. `static defaultRoles = false` opts out (loopar does).
   */
  static defaultRoles = true;

  async defaultRoles() {
    if (this.constructor.defaultRoles === false) return [];
    const label = loopar.utils.Capitalize(String(this.app_name).replace(/[-_]+/g, ' '));
    const app = `App:${this.app_name}`;
    return [
      {
        name: `${label} Manager`,
        description: `Full access to every document of the ${label} app, nothing else of the system.`,
        is_system_role: 1,
        grants: [{ document: app, action: "*" }],
      },
      {
        name: `${label} User`,
        description: `Reads everything in the ${label} app; creates and edits only its own records.`,
        is_system_role: 1,
        grants: [
          { document: app, action: "view",   scope: "all" },
          { document: app, action: "list",   scope: "all" },
          { document: app, action: "search", scope: "all" },
          { document: app, action: "*",      scope: "own" },
        ],
      },
    ];
  }

  async seedRoles(declared = this.constructor.roles) {
    const byName = new Map();
    for (const r of await this.defaultRoles()) byName.set(r.name, r);
    for (const r of (Array.isArray(declared) ? declared : [])) if (r?.name) byName.set(r.name, r);
    const roles = [...byName.values()];
    if (roles.length === 0) return;

    for (const role of roles) {
      if (!role?.name) continue;

      if (!(await loopar.db.count("Role", role.name))) {
        console.log([`[installer] seeding role`, role.name, `(${this.app_name})`]);
        const doc = await loopar.newDocument("Role", {
          name: role.name,
          app: this.app_name,
          description: role.description ?? "",
          is_system_role: role.is_system_role ?? 1,
          disabled: 0,
        });
        await doc.save({ validate: false });
      }

      for (const g of role.grants ?? []) {
        if (!g?.document || !g?.action) continue;
        const where = { relation: "Role", relation_name: role.name, document: g.document, action: g.action };
        if (await loopar.db.count("Permission", where)) continue;
        await loopar.db.insertRow("Permission", {
          name: `Role-${role.name}-${g.document}-${g.action}`,
          ...where,
          app: this.app_name,
          deny: g.deny ? 1 : 0,
          scope: g.scope === "own" ? "own" : "all",
        });
      }
    }
  }

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
    await this.seedRoles();

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
      const owner = entryAppOwner(ent, e);

      // The installer.json lists entries as `Constructor:Name` (e.g.
      // "Entity:Module"). If the meta-entity referenced by `constructor`
      // isn't registered in refs — usually because its FS JSON carries a
      // `__deleted_at__` tombstone and getEntities() skipped it — we can't
      // hydrate the doc and the whole update would 404. Skip with a loud
      // log so the operator can clear the tombstone and re-run instead of
      // aborting the entire update mid-flight.
      if (!loopar.getRef(constructor)) {
        console.warn(
          `[installer] skipping ${e}: meta-entity "${constructor}" not found in refs ` +
          `(check apps/<app>/modules/<module>/<core>/${constructor.toLowerCase()}/${constructor.toLowerCase()}.json — is __deleted_at__ set?)`
        );
        return;
      }

      if(!owner || owner == this.app_name){
        const entityData = await this.getDocumentData(name, entryRoot(ent, e));
        if(entityData){
          let doc = await loopar.getDocument(constructor, name, entityData, { ifNotFound: null });
          const wasFound = !!doc;
          if (!doc) doc = await loopar.newDocument(constructor, entityData);

          console.log([wasFound ? "Updating......." : "Installing.......", constructor, name]);
          (!wasFound || reinstall) && await doc.save({ validate: false, reload: false });
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

      const existing = await loopar.getDocument(
        constructor, name, cleanEnt, { ifNotFound: null }
      );

      if (!existing) {
        console.log([`Inserting ${constructor}:${name}`]);
        const doc = await loopar.newDocument(constructor, { ...cleanEnt, __document_status__: "Active" });
        doc.name = name;
        await doc.save({ validate: false });
      } else if (reinstall || postInstall) {
        console.log([`Updating ${constructor}:${name}`]);
        await existing.save({ validate: false, forceChildren: postInstall });
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
        if (!ref || ref.is_static || ref.is_single || ref.is_virtual) return false;
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