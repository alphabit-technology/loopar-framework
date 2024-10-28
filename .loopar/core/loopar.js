
'use strict';



import { access } from 'fs'
import Knex from '../database/knex.js';
//import DataBaseSqlLite from '../database/database-sqlite.js';
import { GlobalEnvironment } from './global/element-definition.js';
import { documentManage } from './document/document-manage.js';
import path from "path";
import { fileManage } from "./file-manage.js";
import sha1 from "sha1";
import * as Helpers from "./global/helper.js";
import * as dateUtils from "./global/date-utils.js";
import { simpleGit, CleanOptions } from 'simple-git';
import { Session, Cookie } from "./session.js";
import dayjs from "dayjs";
import crypto from "crypto-js";
import fs from "fs";
import { getHttpError } from './global/http-errors.js';
import { marked } from "marked";
import { singularize, titleize, humanize } from "inflection";
import { elementsDict } from "loopar";
import { ChevronDownCircle } from 'lucide-react';

export class Loopar {
  #installingApp = false;
  modulesGroup = []
  pathRoot = process.env.PWD;
  pathFramework = process.argv[1];
  pathCore = process.argv[1];
  session = new Session();
  cookie = new Cookie();
  tailwindClasses = {}
  #server = {};

  constructor() { }

  validateGitRepository(appName, repository) {
    if (!this.gitRepositoryIsValid(repository)) {
      this.throw(`The app ${appName} does not have a valid git repository`);
    }
  }

  set server(server) {
    this.#server = server;
    //this.session.req = server.currentReq;
  }

  get server() {
    return this.#server;
  }

  set installingApp(app) { this.#installingApp = app }
  get installingApp() { return this.#installingApp }
  get installing() { return !!this.#installingApp }

  gitRepositoryIsValid(repository) {
    const regex = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})((\.git)?)$/);
    return regex.test(repository);
  }

  gitAppOptions(app) {
    return {
      baseDir: app ? this.makePath(this.pathRoot, "apps", app) : this.makePath(this.pathRoot, "apps"),
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    }
  }

  git(app) {
    simpleGit().clean(CleanOptions.FORCE);
    return simpleGit(this.gitAppOptions(app));
  }

  hash(value) {
    return sha1(value);
  }

  async initialize() {
    console.log('......Initializing Loopar.......');
    this.utils = Helpers;
    this.dateUtils = dateUtils;
    await this.GlobalEnvironment();
    await this.#loadConfig();
    this.db = new Knex();

    //this.db = new DataBaseSqlLite();
    await this.db.initialize();
    await this.build();

    this.tailwindClasses = {};
    this.setTailwind();
  }

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
      if (appName && !loopar.utils.compare(app.name, appName)) return acc;

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
              //replace all - with space and titleize
              data.__APP__ = titleize(humanize(app.name)).replace(/-/g, ' ');

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

  async buildRefs() {
    let types = {};
    const docs = this.getEntities();

    const getEntityFields = (fields) => {
      const getFields = fields => fields.reduce((acc, field) => acc.concat(field, ...getFields(field.elements || [])), []);

      return getFields(fields).filter(field => {
        const def = elementsDict[field.element]?.def || {};
        return def.isWritable
      }).map(field => field.data.name);
    }

    const refs = Object.values(docs).reduce((acc, doc) => {
      if (doc.__document_status__ == "Deleted") return acc;
      const isBuilder = doc.is_builder || doc.build;

      if (isBuilder) {
        types[doc.name] = {
          entityRoot: doc.entityRoot,
          __NAME__: doc.name,
          __ENTITY__: doc.__ENTITY__ || "Entity",
          __BUILD__: doc.build || doc.name,
          __APP__: doc.__APP__,
          __ID__: doc.id,
          fields: getEntityFields(JSON.parse(doc.doc_structure || "[]"))
        }
      }

      acc[doc.name] = {
        __NAME__: doc.name,
        __APP__: doc.__APP__,
        __ENTITY__: doc.__ENTITY__ || "Entity",
        entityRoot: doc.entityRoot,
        is_single: (!isBuilder && doc.is_single !== 0) ? 1 : 0,
        is_builder: (isBuilder) ? 1 : 0
      }

      return acc;
    }, {});

    await fileManage.setConfigFile('refs', {
      types,
      refs
    });
  }

  getRef(entity) {
    return this.getRefs()[entity];
  }

  getRefs(app) {
    const refs = fileManage.getConfigFile('refs', null, {}).refs;

    if (app) {
      return Object.values(refs).filter(ref => ref.__APP__ === app);
    }

    return refs;
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

  makeClientImporter() {

    /*const fn = `
    import {Entity}
    export default {Entity}
    `
    fileManage.makeFile('apps', 'index', fn, 'jsx', true);*/

  }

  setTailwind(to_element, classes) {
    to_element && (this.tailwindClasses[to_element] = classes);
    let colector = "";

    const filterSpecialChars = (str) => {
      return str.replace(/[^a-zA-Z0-9:/ -]/g, '');
    };

    for (const [element, classes] of Object.entries(this.tailwindClasses)) {
      colector += `<div className="${filterSpecialChars(classes)}"/>`;
    }

    const fn = `
  export function Tailwind() {
    return (
      <div style={{display:"none"}}>${colector}</div>
    );
  }`

    fileManage.makeFile('public/src', 'tailwind', fn, 'jsx', true);
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

  async copyAppFilesToSrc() {
    if (await fileManage.existFolder(this.makePath("src", "__apps-source__"))) {
      await fileManage.deleteFolder("src", "__apps-source__");
    }

    await fileManage.makeFolder("src", "__apps-source__");
    const basePath = this.pathRoot;

    this.eachApps(app => {
      const moduleRoot = path.resolve(basePath, app, `modules`);
      const modules = fs.readdirSync(moduleRoot);

      modules.forEach(module => {
        const coresRoot = path.resolve(`${moduleRoot}/${module}`);
        const cores = fs.readdirSync(coresRoot);

        cores.forEach(core => {
          const entitiesRoot = path.resolve(`${coresRoot}/${core}`);
          const entities = fs.readdirSync(entitiesRoot);

          entities.forEach(entity => {
            const clientFiles = fs.readdirSync(`${basePath}/apps/${app}/modules/${module}/${entity}/client`);

            clientFiles.forEach(clientFile => {
              if (clientFile.split(".")[1] !== "jsx") return;

              const source = this.makePath(this.pathRoot, "apps", app, "modules", module, entity, "client", clientFile);
              const destiny = this.makePath(this.pathRoot, "src", "__apps-source__", clientFile);

              fs.readFile(source, (err, data) => {
                if (err) {
                  console.error('Err on read file:', err);
                  return;
                }

                fs.writeFile(destiny, data, (err) => {
                  if (err) {
                    console.error('Err on write file:', err);
                    return;
                  }
                });
              });
            });
          });
        });
      });
    });
  }

  async #loadConfig(data = null) {
    if (data) {
      Object.assign(this, data);
    } else {
      await this.#loadConfig(fileManage.getConfigFile('loopar.config', null, {}));
    }
  }

  async makeDefaultFolders() {
    await fileManage.makeFolder('', "apps");
    await fileManage.makeFolder('public/uploads', "thumbnails");
    await fileManage.makeFolder('public/js', 'components');
  }

  async build() {
    console.log('......Building Loopar.......');
    await this.makeDefaultFolders();
    if (this.installingApp) return;

    await this.buildRefs();
    const writeFile = async (data) => {
      await fileManage.setConfigFile('loopar.config', data);

      await this.#loadConfig(data);
    }

    const writeModules = async (data) => {
      this.db.pagination = null;
      const groupList = await this.db.getList('Module Group', ['name', 'description'], { '=': { in_sidebar: 1 } });

      for (const g of groupList) {
        const modulesGroup = { name: g.name, description: g.description, modules: [] };

        const moduleList = await this.db.getList(
          'Module',
          ['name', 'icon', 'description', 'module_group'],
          {
            '=': {
              module_group: g.name,
              in_sidebar: 1
            }
          }
        );

        for (const m of moduleList) {
          const module = { link: m.name, icon: m.icon, description: m.description, routes: [] };

          const routeList = await this.db.getList("Entity", ['name', 'is_single'], {
            '=': { module: m.name }
          });

          module.routes = routeList.map(route => {
            return { link: route.is_single ? 'update' : route.name, description: route.name }
          });

          modulesGroup.modules.push(module);
        }

        data.modulesGroup.push(modulesGroup);
      }

      data.initializedModules = true;
      this.modulesGroup = data.modulesGroup;

      await writeFile(data);
    }

    const data = {
      DBInitialized: this.DBInitialized,
      modulesGroup: []
    };

    this.DBServerInitialized = await this.db.testServer();
    this.DBInitialized = (this.DBServerInitialized && await this.db.testDatabase());
    this.__installed__ = (this.DBInitialized && await this.db.testFramework("loopar"));

    data.DBInitialized = this.DBInitialized;
    data.DBServerInitialized = this.DBServerInitialized;
    data.__installed__ = this.__installed__;

    if (data.__installed__) {
      const activeWebApp = await this.db.getDoc('System Settings');
      const webApp = await this.db.getDoc('App', activeWebApp.active_web_app);

      data.webApp = {
        ...(webApp || {}),
        menu_items: webApp ? await this.db.getAll("Menu Item", ["*"], { '=': { parent_id: webApp.id } }) : []
      }

      await writeModules(data);
    } else {
      await writeFile(data);
    }
  }

  printMessage() {
    console.log(`__________________________________________________________`);
    console.log(...arguments);
    console.log(`***********************************************************\n`);

  }

  printSuccess() {
    console.log("\x1b[32m__________________________________________________________");
    console.log(...arguments);
    console.log(`\x1b[32m***********************************************************`);
    console.log("\x1b[0m", "");
  }

  printError() {
    console.log("\x1b[31m__________________________________________________________");
    console.error(...arguments);
    console.log(`\x1b[31m***********************************************************`);
    console.log("\x1b[0m", "");
  }

  async systemsSettings() {
    return await this.getDocument("System Settings");
  }

  async #writeDefaultSSettings() {
    await fileManage.makeFolder('', "config");

    if (!fileManage.existFileSync(path.join('config', 'db.config.json'))) {
      await fileManage.setConfigFile('db.config', {});
      /*await fileManage.setConfigFile('db.config', {
        "host": "localhost",
        "user": "root",
        "password": "root",
        "port": "3306",
        "dialect": "mysql",
        "pool": {
          "max": 5,
          "min": 0,
          "acquire": 30000,
          "idle": 10000
        }
      });*/
    }

    if (!fileManage.existFileSync(path.join('config', 'loopar.config.json'))) {
      await fileManage.setConfigFile('loopar.config', {});
    }

    if (!fileManage.existFileSync(path.join('config', 'server.config.json'))) {
      await fileManage.setConfigFile('server.config', {
        "port": 3030,
        "session": {
          "secret": "secrctekeyf5d665dd56ff59fbd24699e502a528f77eb786e8",
          "saveUninitialized": false,
          "cookie": { "maxAge": 86400000 },
          "resave": false
        }
      });
    }
  }

  async GlobalEnvironment() {
    GlobalEnvironment();

    process.on('uncaughtException', err => {
      this.printError('LOOPAR: uncaughtException', err);

      try {
        this.server && this.server.renderError({ error: getHttpError(err) });
      } catch (error) {
        this.printError(['LOOPAR: uncaughtException', err]);
        this.printError(['LOOPAR: uncaughtException produced by', error]);
      }
    });

    //global.__META_COMPONENTS__ = {};
    global.Crypto = crypto;
    global.AJAX = 'POST';
    global.env = {};
    global.dayjs = dayjs;

    await this.#writeDefaultSSettings();

    env.dbConfig = fileManage.getConfigFile('db.config');
    env.looparConfig = fileManage.getConfigFile('loopar.config', null, {});
    env.serverConfig = fileManage.getConfigFile('server.config');
  }

  parseDocStructure(doc_structure) {
    return doc_structure.map(field => {
      field.data.value = field.element === MARKDOWN ? marked(field.data.value) : field.data.value;

      if (field.elements) {
        field.elements = this.parseDocStructure(field.elements);
      }

      return field;
    });
  }

  async #GET_ENTITY(document, { fromFile } = {}) {
    const throwError = (type) => {
      this.throw({
        code: 404,
        message: `${(type || "Entity")}: ${document} not found`,
      });
    }

    let ENTITY = null;
    const ref = this.getRef(document);
    if (!ref) return throwError();

    const entity = ref.__ENTITY__;

    /**Testing get fileRef only */
    ENTITY = await fileManage.getConfigFile(document, ref.entityRoot);

    /*if (fromFile || this.installing) {
      ENTITY = await fileManage.getConfigFile(document, ref.entityRoot);
    } else {
      const entityFields = this.getType(entity).fields;
      ENTITY = await loopar.db.getDoc(entity, document, entityFields);
    }*/

    if (!ENTITY) return throwError(entity);
    ENTITY.is_single ??= ref.is_single;
    ENTITY.__REF__ = ref;

    ENTITY.is_single && (ENTITY.doc_structure = JSON.stringify(this.parseDocStructure(JSON.parse(ENTITY.doc_structure))));

    return ENTITY;
  }

  /**
   * 
   * @param {*} document DocumentType name
   * @param {*} name Document name
   * @param {*} data
   * @param {*} moduleRoute Path to app root folder 
   * @returns 
   */
  async getDocument(document, name, data = null, { fromFile = false } = {}) {
    const ENTITY = await this.#GET_ENTITY(document, { fromFile });

    return await documentManage.getDocument(ENTITY, name, data);
  }

  /**
   * 
   * @param {*} document 
   * @param {*} data 
   * @param {*} moduleRoute 
   * @param {*} name 
   * @returns 
   */
  async newDocument(document, data = {}, { app, module, name = null } = {}) {
    const ENTITY = await this.#GET_ENTITY(document, { app, module });
    return await documentManage.newDocument(ENTITY, data, name);
  }

  async getErrDocument() {
    return await this.newDocument("Error", {}, { app: "loopar", module: "core" });
  }

  async deleteDocument(document, name, { updateInstaller = true, sofDelete = true, force = false, ifNotFound = null, updateHistory = true } = {}) {
    const Doc = await this.getDocument(document, name);
    await Doc.delete({ updateInstaller, sofDelete, force, updateHistory });
  }

  /*async getForm(formName, data = {}) {
     const ENTITY = await this.#GET_ENTITY(formName, 'Form', 'form_structure');

     return documentManage.getForm(ENTITY, data);
  }

  async newForm(formName, data = {}) {
     const ENTITY = await this.#GET_ENTITY(formName, 'Form', 'form_structure');

     return await documentManage.newForm(ENTITY, data);
  }*/

  exist(path) {
    return new Promise(res => {
      access(path, (err) => {
        return res(!err);
      });
    });
  }

  async getList(document, { fields = null, filters = {}, orderBy = 'name', limit = 10, offset = 0, q = null, rowsOnly = false } = {}, ifNotFound = null) {
    const doc = await this.newDocument(document);
    return await doc.getList({ fields, filters, orderBy, limit, offset, page: parseInt(this.session.get(document + "_page", 1), rowsOnly), q });
  }

  jsonParse(json) {
    try {
      return JSON.parse(json);
    } catch (e) {
      return {};
    }
  }

  /*getError(errorType, errorMessage, errorCode = 500) {
     return {
        code: err.code || 500,
        message: err.message || 'Internal Server Error',
        data: err.data || null,
     };
  }*/

  throw(error) {
    error = typeof error === 'string' ? { code: 400, message: error } : error
    const err = new Error(error.message);
    err.code = error.code;

    this.#installingApp = null;
    throw err;
  }

  async getUser(user_id) {
    const user = await this.db.getList('User',
      ['name', 'email', 'password', 'disabled', 'profile_picture'],
      {
        '=': { name: user_id },
        "OR": {
          '=': { email: user_id }
        }
      });

    return user.length > 0 ? user[0] : null;
  }

  /*get session() {
    return this.server && this.server.req && this.server.req.session ? this.server.req.session : {};
  }*/

  isLoggedIn() {
    return this.currentUser;
  }

  get currentUser() {
    return this.session.get('user') || null;
  }

  async updateInstaller() {
    const { entity, appName, record, deleteRecord = false } = arguments[0];
    const docName = entity.name;

    const appPath = loopar.makePath("apps", appName);
    if (this.installing) return;

    const installerData = fileManage.getConfigFile('installer', appPath, {});

    if (deleteRecord) {
      delete installerData[docName][record.name];
    } else {
      installerData[docName] ??= {};
      installerData[docName].entityId = entity.id;
      installerData[docName].documents ??= {};

      if (record instanceof Array) {
        for (const rec of record) {
          installerData[docName].documents[rec.name] = rec;
        }
      } else {
        installerData[docName].documents[record.name] = record;
      }
    }

    await fileManage.setConfigFile('installer', installerData, appPath);
  }

  async appStatus(appName) {
    return await loopar.db.getValue('App', 'name', appName) ? 'installed' : 'uninstalled';
  }

  unInstallApp(appName) {
    if (this.installing) return;

    if (appName === "loopar") {
      this.throw("You can't uninstall app Loopar");
      return;
    }

    return new Promise(async (resolve, reject) => {
      this.installingApp = appName;

      const installerRoute = this.makePath('apps', appName, 'installer.js');

      const installer = await fileManage.importClass(installerRoute, () => {
        this.throw(`App ${appName} does not have an installer`);
      });

      const Installer = new installer({ app_name: appName });

      return Installer.unInstall().then(async r => {
        await this.build();
        this.installingApp = null;
        resolve(r);
      }).catch((error) => {
        this.installingApp = null;
        reject(error);
      });
    });
  }

  async getApp(appName) {
    if (await this.appStatus(appName) === 'installed') {
      return await loopar.db.getDoc('App', appName);
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

    return loopar.utils.decamelize(joinedPath, { separator: '-' });
  }

  async getSettings() {
    this.systemSettings ??= await this.db.getDoc("System Settings", null, ["*"], { isSingle: 1 });
    return this.systemSettings;
  }
}

export const loopar = await new Loopar();