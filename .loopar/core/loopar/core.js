
import inflection, { titleize, singularize } from "inflection";
import { elementsDict } from "loopar";
import fs from "fs";
import path from "pathe";
import { fileManage } from "../file-manage.js";

export class Core {
  getApps() {
    const baseApps = this.getDirList(this.makePath(this.pathRoot, "apps")).map(app => {
      return {
        ...app,
        appRoot: this.makePath("apps", app.name)
      }
    });
    const coreApp = this.getDirList(this.makePath(this.pathRoot, ".loopar", "apps")).map(app => {
      return {
        ...app,
        appRoot: this.makePath(".loopar", "apps", app.name)
      }
    });

    return [...coreApp, ...baseApps];
  }

  getEntities(appName) {
    return this.getApps().reduce((acc, app) => {
      if (appName && !this.utils.compare(app.name, appName)) return acc;

      const moduleRoot = this.makePath(this.pathRoot, app.appRoot, `modules`);
      const modules = this.getDirList(moduleRoot);

      modules.forEach(module => {
        const coresRoot = path.resolve(`${moduleRoot}/${module.name}`);
        const cores = this.getDirList(coresRoot) || [];

        cores.forEach(core => {
          const entitiesRoot = path.resolve(`${coresRoot}/${core.name}`);
          const entities = this.getDirList(entitiesRoot);

          entities.forEach(entity => {
            let data = this.getFile(this.makePath(entitiesRoot, entity.name, entity.name) + ".json");

            if (data) {
              data = this.utils.isJSON(data) ? JSON.parse(data) : null;
              data.entityRoot = this.makePath(app.appRoot, "modules", module.name, core.name, entity.name);
              data.type = titleize(singularize(core.name));
              data.__MODULE__ = module.name;
              //replace all - with space and titleize
              data.__APP__ = app.name//titleize(humanize(app.name)).replace(/-/g, ' ');

              acc.push(data);
            } else {
              console.log([`Entity [${entity.name}] not found`]);
            }
          });
        });
      });

      return acc;
    }, []);
  }

  entityIsSingle(ENT) {
    return (["Page", "Form", "Report", "View", "Controller"].includes(ENT.type) || ENT.is_single) ? 1 : 0;
  }

  async buildRefs() {
    let types = {};
    const docs = this.getEntities();

    const getEntityFields = (fields) => {
      const getFields = fields => fields.reduce((acc, field) => acc.concat(field, ...getFields(field.elements || [])), []);

      return getFields(fields).filter(field => {
        const def = elementsDict[field.element]?.def || {};
        return def.isWritable && !!field.data.name// && !field.element.includes(FORM_TABLE);
      }).map(field => field.data.name)
    }

    const refs = Object.values(docs).reduce((acc, doc) => {
      if (doc.__document_status__ == "Deleted") return acc;
      
      const isBuilder = (doc.build || ['Builder', 'Entity'].includes(doc.name)) ? 1 : 0;
      const isSingle = this.entityIsSingle(doc);
      const fields = typeof doc.doc_structure == "object" ? doc.doc_structure : JSON.parse(doc.doc_structure || "[]");

      if (isBuilder) {
        types[doc.name] = {
          __ROOT__: doc.entityRoot,
          __NAME__: doc.name,
          __ENTITY__: doc.__ENTITY__ || "Entity",
          __BUILD__: doc.build || doc.name,
          __APP__: doc.__APP__,
          __ID__: doc.id,
          __TYPE__: doc.type,
          __MODULE__: doc.__MODULE__,
          __FIELDS__: getEntityFields(fields)
        }
      }

      acc[doc.name] = {
        __NAME__: doc.name,
        __APP__: doc.__APP__,
        __ENTITY__: doc.__ENTITY__ || "Entity",
        __ROOT__: doc.entityRoot,
        is_single: isSingle,
        is_builder: isBuilder,
        __MODULE__: doc.__MODULE__,
        __TYPE__: doc.type,
        __FIELDS__: getEntityFields(fields)
      }

      return acc;
    }, {});

    await fileManage.setConfigFile('refs', {
      types,
      refs
    });
  }

  getRef(entity, alls=true) {
    return this.getRefs(null, alls)[entity];
  }

  getRefs(app, alls = false) {
    const refs = fileManage.getConfigFile('refs', null, {}).refs;
    const installedApps = alls ? [] : Object.keys(fileManage.getConfigFile('installed-apps')).map(
      app => inflection.transform(app, ['capitalize', 'dasherize']).toLowerCase()
    );

    const result = {};
    for (const key in refs) {
      if (Object.hasOwn(refs, key)) {
        const ref = refs[key];

        if (app && ref.__APP__ !== app) continue;

        const selfApp = inflection.transform(ref.__APP__, ['capitalize', 'dasherize']).toLowerCase();
        if (alls || installedApps.includes(selfApp) || ['loopar', 'core'].includes(selfApp)) {
          result[ref.__NAME__] = ref;
        }
      }
    }

    return result;
  }

  getType(type) {
    return this.getTypes()[type];
  }

  getTypes(app) {
    const types = fileManage.getConfigFile('refs', null, {}).types;

    if (app) {
      return Object.values(types).filter(type => type.__APP__ === app);
    }

    return types;
  }

  eachAppsSync(fn) {
    fs.readdirSync(this.makePath(this.pathRoot, "apps")).forEach(app => {
      if (fs.lstatSync(this.makePath(this.pathRoot, "apps", app)).isDirectory()) {
        fn(app);
      }
    });
  }

  getDirList(path) {
    return fs.readdirSync(path, { withFileTypes: true });
  }

  getFile(path) {
    return !fs.existsSync(path) ? null : fs.readFileSync(path, 'utf8');
  }

  /* exist(path) {
    return new Promise(res => {
      access(path, (err) => {
        return res(!err);
      });
    });
  } */

  async appStatus(appName) {
    return await this.db.getValue('App', 'name', appName) ? 'installed' : 'uninstalled';
  }

  async unInstallApp(appName) {
    if (this.installing) return;
    const installerRoute = this.makePath('apps', appName, 'installer.js');

    const installer = await fileManage.importClass(installerRoute, () => {
      this.throw(`App ${appName} does not have an installer`);
    });

    const Installer = new installer({ app_name: appName });
    return await Installer.unInstall();
  }

  async getApp(appName) {
    if (await this.appStatus(appName) === 'installed') {
      return await this.db.getDoc('App', appName);
    } else {
      return null;
    }
  }

  makePath(...args) {
    let pathArray = args;

    if (!args[0].startsWith("./")) {
      pathArray = ["/", ...args];
    }

    const joinedPath = path.join(...pathArray);

    return this.utils.decamelize(joinedPath, { separator: '-' });
  }
}