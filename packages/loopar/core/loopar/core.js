
import inflection, { titleize, singularize } from "inflection";
import { elementsDict } from "loopar";
import fs from "fs";
import path from "pathe";
import { fileManage } from "../file-manage.js";
import { Builder } from "./builder.js";

export class Core extends Builder {
  getApps() {
    const baseApps = this.getDirList(this.makePath(this.pathRoot, "apps")).map(app => {
      return {
        ...app,
        appRoot: this.makePath("apps", app.name)
      }
    });

    const pathCore = this.pathCore.split(this.pathRoot).pop();
    const coreApp = this.getDirList(this.makePath(this.pathRoot, pathCore, "apps")).map(app => {
      return {
        ...app,
        appRoot: this.makePath(pathCore, "apps", app.name)
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
              if(data.__document_status__ !== 'Deleted') {
                data.entityRoot = this.makePath(app.appRoot, "modules", module.name, core.name, entity.name);
                data.type = titleize(singularize(core.name));
                data.__MODULE__ = module.name;
                //replace all - with space and titleize
                data.__APP__ = app.name//titleize(humanize(app.name)).replace(/-/g, ' ');

                acc.push(data);
              }
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

  getRef(entity, alls=true) {
    return this.getRefs(null, alls, entity)[this.utils.toEntityKey(entity)] || null;
  }

  getRefs(app, alls = false, e) {
    const refs = this.__REFS__;
    const installedApps = alls ? [] : Object.keys(this.installedApps).map(
      app => inflection.transform(app, ['capitalize', 'dasherize']).toLowerCase()
    );

    const result = {};
    for (const key in refs) {
      if (Object.hasOwn(refs, key)) {
        const ref = refs[key];

        if (app && ref.__APP__ !== app) continue;

        const selfApp = inflection.transform(ref.__APP__, ['capitalize', 'dasherize']).toLowerCase();
        if (alls || installedApps.includes(selfApp) || ['loopar', 'core'].includes(selfApp)) {
          result[this.utils.toEntityKey(ref.__NAME__)] = ref;
        }
      }
    }

    return result;
  }

  getType(type) {
    return this.getTypes()[type];
  }

  getTypes(app) {
    const types = this.__TYPES__;

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

  getUniqueKey() {
    return "k"+Math.random().toString(36).substr(2, 9);
  }
}