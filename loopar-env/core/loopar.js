
'use strict';

import { access } from 'fs'
import DataBase from '../database/database.js';
import DataBaseSqlLite from '../database/database-sqlite.js';
import { GlobalEnvironment } from './global/element-definition.js';
import { documentManage } from './document/document-manage.js';
import path from "path";
import { fileManage } from "./file-manage.js";
import sha1 from "sha1";
import * as Helpers from "./helper.js";
import { simpleGit, CleanOptions } from 'simple-git';
import elementGenerator from "./element-generator.js";
import { Session } from "./session.js";
import dayjs from "dayjs";

export class Loopar {
   installing = false;
   modulesGroup = []
   pathRoot = process.env.PWD;
   pathFramework = process.argv[1];
   pathCore = process.argv[1];
   baseDocumentFields = ["id", "name", "type", "module", "doc_structure", "title_fields", "search_fields", "is_single", "is_static"];
   session = new Session();

   constructor() { }

   validateGitRepository(repository) {
      if (!this.gitRepositoryIsValid(repository)) {
         loopar.throw('Invalid GitHub URL ' + repository);
      }
   }

   gitRepositoryIsValid(repository) {
      const regex = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})((\.git)?)$/);
      return regex.test(repository);
   }

   gitAppOptions(app) {
      return {
         baseDir: app ? path.join(this.pathRoot, "apps", app) : path.join(this.pathRoot, "apps"),
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
      console.log('Initializing Loopar...');
      await this.GlobalEnvironment();
      await this.#loadConfig();
      this.db = new DataBase();
      //this.db = new DataBaseSqlLite();
      await this.db.initialize();
      await this.makeConfig();
      this.utils = Helpers;
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
      await fileManage.makeFile('public/js/components', 'elements', elementGenerator(), 'js', true);

      const writeFile = async (data) => {
         await fileManage.setConfigFile('loopar.config', data);

         await this.#loadConfig(data)
      }

      const writeModules = async (data) => {
         this.db.pagination = null;

         const group_list = await this.db.getList('Module Group', ['name', 'description'], { '=': { in_sidebar: 1 } });

         for (const g of group_list) {
            const modules_group = { name: g.name, description: g.description, modules: [] };

            const module_list = await this.db.getList(
               'Module',
               ['name', 'icon', 'description', 'module_group'],
               {
                  '=': { module_group: g.name },
                  'AND': {
                     '=': { in_sidebar: 1 },
                  },
               }
            );

            for (const m of module_list) {
               const module = { link: m.name, icon: m.icon, description: m.description, routes: [] };

               const route_list = await this.db.getList("Document", ['name', 'is_single'], {
                  '=': { module: m.name }
               });

               module.routes = route_list.map(route => {
                  return { link: route.is_single ? 'update' : route.name, description: route.name }
               });

               modules_group.modules.push(module);
            }

            data.modulesGroup.push(modules_group);
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

      //
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

      global.AJAX = 'POST';
      global.currentController = null;
      global.env = {};
      global.dayjs = dayjs;
      await this.#writeDefaultSSettings();

      env.dbConfig = fileManage.getConfigFile('db.config');
      env.looparConfig = fileManage.getConfigFile('loopar.config', null, {});
      env.serverConfig = fileManage.getConfigFile('server.config');

      process.on('uncaughtException', err => {
         console.error(['uncaughtException', err]);

         if (this.db) {
            this.db.transaction = false;
            this.db.transactions = [];
         }

         if (currentController) {
            currentController.sendError(err);
         }
      });
   }

   #makeDoctypeFields(fields = JSON.parse(this.__DOCTYPE__.doc_structure) || []) {
      return fields.reduce((acc, field) => {
         return acc.concat(field, ...this.#makeDoctypeFields(field.elements || []));
      }, []);
   }

   async #GET_DOCTYPE(document, type = 'Document', fieldDocStructure, byFile = null) {
      const fields = this.baseDocumentFields;
      let doctype;

      if (byFile) {
         doctype = fileManage.getConfigFile(document, loopar.makePath("apps", byFile, document));
      } else {
         doctype = await loopar.db.getDoc(type, document, [fieldDocStructure, ...fields]);
      }

      if (!doctype) {
         this.throw({
            code: 404,
            message: `Document ${document} not found`,
         });
      }

      return doctype;
   }

   async getDocument(document, documentName, data = null, byFile = null) {
      const DOCTYPE = await this.#GET_DOCTYPE(document, 'Document', 'doc_structure', byFile);

      if (DOCTYPE && byFile) {
         DOCTYPE.app_name = byFile.split('/')[0];
      }

      return await documentManage.getDocument(DOCTYPE, documentName, data);
   }

   async newDocument(document, data = {}, documentName = null, byFile = null) {
      const DOCTYPE = await this.#GET_DOCTYPE(document, 'Document', 'doc_structure', byFile);
      if (DOCTYPE && byFile) {
         DOCTYPE.app_name = byFile.split('/')[0];
      }

      return await documentManage.newDocument(DOCTYPE, data, documentName);
   }

   async deleteDocument(document, documentName, updateInstaller = true) {
      const doc = await this.getDocument(document, documentName);

      await doc.delete({ updateInstaller });
   }

   async getForm(formName, data = {}) {
      const DOCTYPE = await this.#GET_DOCTYPE(formName, 'Form', 'form_structure');

      return documentManage.getForm(DOCTYPE, data);
   }

   async newForm(formName, data = {}) {
      const DOCTYPE = await this.#GET_DOCTYPE(formName, 'Form', 'form_structure');

      return await documentManage.newForm(DOCTYPE, data);
   }

   exist(path) {
      return new Promise(res => {
         access(path, (err) => {
            return res(!err);
         });
      });
   }

   async getList(document, { fields = null, filters = {}, order_by = 'name', limit = 10, offset = 0, q = null } = {}, ifNotFound = null) {
      const doc = await this.newDocument(document);

      return await doc.getList({ fields, filters, order_by, limit, offset, page: this.session.get(document + "_page") || 1, q });
   }

   jsonParse(json) {
      try {
         return JSON.parse(json);
      } catch (e) {
         return {};
      }
   }

   getError(error_type, error_message, error_code = 500) {
      return {
         code: err.code || 500,
         message: err.message || 'Internal Server Error',
         data: err.data || null,
      };
   }

   throw(error) {
      this.installing = false;
      const error_type = NOT_IMPLEMENTED_ERROR;
      if (typeof error === 'string') {
         error = {
            error: error_type.code,
            error_type: error_type.title,
            message: error
         };
      } else if (typeof error === 'object') {
         error = {
            error: (error.code || error_type.code),
            error_type: (error.code ? 'Error ' + error.code : error_type.title),
            message: error.message || error_type.title,
         };
      }

      if (currentController) {
         currentController.error = error;
      }

      throw new Error(error.message);
   }

   async getUser(user_id) {
      const user = await this.db.getList('User',
         ['name', 'email', 'password', 'disabled', 'profile_picture'],
         { '=': { name: user_id }, "OR": { '=': { email: user_id } } }
      );

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
      const { doctype, documentName, appName, record, deleteRecord = false } = arguments[0];
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

      return Helpers.decamelize(joinedPath, { separator: '-' }).toLowerCase();
   }
}

export const loopar = await new Loopar();