
'use strict';

import { access } from 'fs'
import DataBase from '../database/database.js';
//import DataBaseSqlLite from '../database/database-sqlite.js';
import { GlobalEnvironment } from './global/element-definition.js';
import { documentManage } from './document/document-manage.js';
import path from "path";
import { fileManage } from "./file-manage.js";
import sha1 from "sha1";
import * as Helpers from "./global/helper.js";
import * as dateUtils from "./global/date-utils.js";
import { simpleGit, CleanOptions } from 'simple-git';
import { Session } from "./session.js";
import dayjs from "dayjs";
import crypto from "crypto-js";
import fs from "fs";
import { getHttpError } from './global/http-errors.js';

export class Loopar {
  #installingApp = false;
  modulesGroup = []
  pathRoot = process.env.PWD;
  pathFramework = process.argv[1];
  pathCore = process.argv[1];
  baseDocumentFields = ["id", "name", "type", "module", "doc_structure", "title_fields", "search_fields", "is_single", "is_static"];
  session = new Session();
  tailwindClasses = {}

  constructor() { }

  validateGitRepository(appName, repository) {
    if (!this.gitRepositoryIsValid(repository)) {
      this.throw(`The app ${appName} does not have a valid git repository`);
    }
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
    this.db = new DataBase();

    //this.db = new DataBaseSqlLite();
    await this.db.initialize();
    await this.makeConfig();
    this.tailwindClasses = {};
    this.setTailwind();
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
  
  eachApps(fn) {
    fs.readdirSync(this.makePath(this.pathRoot, "apps")).forEach(app => {
      if (fs.lstatSync(this.makePath(this.pathRoot, "apps", app)).isDirectory()) {
        fn(app);
      }
    });
  }

  async copyAppFilesToSrc() {

    if (await fileManage.existFolder(this.makePath("src", "__apps-source__"))) {
      await fileManage.deleteFolder("src", "__apps-source__");
    }

    await fileManage.makeFolder("src", "__apps-source__");
    const basePath = this.pathRoot;

    //fs.readdirSync(this.makePath(this.pathRoot, "apps")).forEach(app => {
    this.eachApps(app => {
      const modules = fs.readdirSync(`${basePath}/apps/${app}/modules`);
      modules.forEach(module => {
        const documents = fs.readdirSync(`${basePath}/apps/${app}/modules/${module}`);
        documents.forEach(document => {
          const clientFiles = fs.readdirSync(`${basePath}/apps/${app}/modules/${module}/${document}/client`);

          clientFiles.forEach(clientFile => {
            if (clientFile.split(".")[1] !== "jsx") return;

            const source = this.makePath(this.pathRoot, "apps", app, "modules", module, document, "client", clientFile);
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
    //});
  }

  async #loadConfig(data = null) {
    if (data) {
      Object.assign(this, data);
    } else {
      await this.#loadConfig(fileManage.getConfigFile('loopar.config', null, {}));
    }
  }

  async makeConfig() {
    await fileManage.makeFolder('', "apps");
    await fileManage.makeFolder('public/uploads', "thumbnails");
    await fileManage.makeFolder('public/js', 'components');

    const writeFile = async (data) => {
      await fileManage.setConfigFile('loopar.config', data);

      await this.#loadConfig(data)
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

          const routeList = await this.db.getList("Document", ['name', 'is_single'], {
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
      databaseInitialized: this.databaseInitialized,
      modulesGroup: []
    };

    data.databaseServerInitialized = await this.db.testServer();
    data.databaseInitialized = data.databaseServerInitialized && await this.db.testDatabase();
    data.frameworkInstalled = data.databaseInitialized && await this.db.testFramework();

    if (data.frameworkInstalled) {
      data.baseDocumentFields = this.#makeDoctypeFields(
        JSON.parse(await this.db.getValue('Document', 'doc_structure', 'Document')) || []
      ).filter(field => fieldIsWritable(field)).map(field => field.data.name);

      await writeModules(data);

      this.defaultWebApp = await this.db.getValue('App', 'name', { '=': { default_app: 1 } });
    } else {
      await writeFile(data);
    }
  }

  async #writeDefaultSSettings() {
    await fileManage.makeFolder('', "config");

    if (!fileManage.existFileSync(path.join('config', 'db.config.json'))) {
      await fileManage.setConfigFile('db.config', {
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
      });
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
      console.error(['LOOPAR: uncaughtException', err]);

      const httpError = getHttpError(err);

      const error = new Error(httpError.description);
      error.stack = err.stack || httpError.description;
      error.code = httpError.code;
      error.description = httpError.description;

      
      if (this.db) {
        this.db.transaction = false;
        this.db.transactions = [];
      }

      const {res,req} = this.lastController || {};
      if(this.lastController && !this.lastController.completedTransaction){
        this.lastController.completedTransaction = true;
        this.lastController.sendError(error).then(response => {
          console.log(["On send Error", response])
          this.server.sendResponse(res, req, response);
        });
      }else if(res){
        this.lastController = null;
        this.server.sendResponse(res, req, error);
      }else{
        try {
          this.res.status(500).send(`
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column; background-color: #0b0b0f; color: #95b3d6;">
              <h1 style="font-size: 100px; margin: 0;">500</h1>
              <h3 style="font-size: 30px; margin: 0;">Internal Sever Error</h3>
              <span style="font-size: 20px; margin: 0;">${err.stack}</span>
              <hr style="width: 50%; margin: 20px 0;"/>
              <span style="font-size: 20px; margin: 0;">Loopar</span>
            </div>
        `);
        } catch (e) {
          console.error(['LOOPAR: Internal Server Error', e]);
        }
      }
    });

    global.crypto = crypto;
    global.AJAX = 'POST';
    global.env = {};
    global.dayjs = dayjs;
    await this.#writeDefaultSSettings();

    env.dbConfig = fileManage.getConfigFile('db.config');
    env.looparConfig = fileManage.getConfigFile('loopar.config', null, {});
    env.serverConfig = fileManage.getConfigFile('server.config');
  }

  #makeDoctypeFields(fields = JSON.parse(this.__DOCTYPE__.doc_structure) || []) {
    return fields.reduce((acc, field) => {
      return acc.concat(field, ...this.#makeDoctypeFields(field.elements || []));
    }, []);
  }

  async #GET_DOCTYPE(document, { app = null, module = null } = {}) {
    let { appName, moduleName } = { appName: app, moduleName: module };

    if (["Document", "Module", "Module Group", "App"].includes(document)) {
      appName = "loopar";
      moduleName = "core";
    }

    const DOCTYPE = (appName && moduleName) ?
      fileManage.getConfigFile(document, loopar.makePath("apps", appName, "modules", moduleName, document)) :
      await loopar.db.getDoc("Document", document, ["doc_structure", ...this.baseDocumentFields]);

    if (!DOCTYPE) {
      this.throw({
        code: 404,
        message: `Document ${document} not found`,
      });
    }

    appName && (DOCTYPE.__APP__ = appName);
    moduleName && (DOCTYPE.__MODULE__ = moduleName);

    return DOCTYPE;
  }

  /**
   * 
   * @param {*} document DocumentType name
   * @param {*} documentName Document name
   * @param {*} data
   * @param {*} moduleRoute Path to app root folder 
   * @returns 
   */
  async getDocument(document, documentName, data = null, { app = null, module = null } = {}) {
    const DOCTYPE = await this.#GET_DOCTYPE(document, { app, module });

    return await documentManage.getDocument(DOCTYPE, documentName, data, app);
  }

  /**
   * 
   * @param {*} document 
   * @param {*} data 
   * @param {*} moduleRoute 
   * @param {*} documentName 
   * @returns 
   */
  async newDocument(document, data = {}, { app, module, documentName = null } = {}) {
    const DOCTYPE = await this.#GET_DOCTYPE(document, { app, module });
    return await documentManage.newDocument(DOCTYPE, data, documentName);
  }

  async getErrDocument(){
    return await this.newDocument("Error", {}, { app: "loopar", module: "core" });
  }

  async deleteDocument(document, documentName, { updateInstaller = true, sofDelete = true, force = false, ifNotFound = null, updateHistory = true } = {}) {
    const Doc = await this.getDocument(document, documentName);
    await Doc.delete({ updateInstaller, sofDelete, force, updateHistory });
  }

  /*async getForm(formName, data = {}) {
     const DOCTYPE = await this.#GET_DOCTYPE(formName, 'Form', 'form_structure');

     return documentManage.getForm(DOCTYPE, data);
  }

  async newForm(formName, data = {}) {
     const DOCTYPE = await this.#GET_DOCTYPE(formName, 'Form', 'form_structure');

     return await documentManage.newForm(DOCTYPE, data);
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
    error = typeof error === 'string' ? {code: 400, message: error} : error
    const err = new Error(error.message);
    err.code = error.code;

    this.#installingApp = null;
    this.lastController && (this.lastController.error = error);

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

  get session() {
    return this.server && this.server.req && this.server.req.session ? this.server.req.session : {};
  }

  isLoggedIn() {
    return this.currentUser;
  }

  get currentUser() {
    return this.session.get('user') || null;
  }

  async updateInstaller() {
    const { doctype, appName, record, deleteRecord = false } = arguments[0];
    const document = doctype.name;

    const appPath = loopar.makePath("apps", appName);
    if (this.installing) return;

    const installerData = fileManage.getConfigFile('installer', appPath, {});

    if (deleteRecord) {
      delete installerData[document][record.name];
    } else {
      installerData[document] ??= {};
      installerData[document].doctypeId = doctype.id;
      installerData[document].documents ??= {};

      if (record instanceof Array) {
        record.forEach(rec => {
          installerData[document].documents[rec.name] = rec;
        });
      } else {
        installerData[document].documents[record.name] = record;
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
        await this.makeConfig();
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
    this.systemSettings ??= await this.db.getDoc("System Settings", null, ["*"], {isSingle: 1});
    return this.systemSettings;
  }
}

export const loopar = await new Loopar();