
'use strict';

import Knex from '../database/knex.js';
import { GlobalEnvironment } from './global/element-definition.js';
import path from "pathe";
import { fileManage } from "./file-manage.js";
import sha1 from "sha1";
import * as Helpers from "./global/helper.js";
import * as dateUtils from "./global/date-utils.js";
import { simpleGit, CleanOptions } from 'simple-git';
import { Session, Cookie } from "./session.js";
import dayjs from "dayjs";
import crypto from "crypto-js";
import { getHttpError } from './global/http-errors.js';
import * as lucideIcons from 'lucide-react'
import jwt from 'jsonwebtoken';
import Auth from './auth.js';
import { Document } from './loopar/document.js';

export class Loopar extends Document {
  #installingApp = false;
  modulesGroup = []
  pathRoot = process.cwd();
  pathCore = process.argv[1];
  session = new Session();
  #cookie = new Cookie();
  auth = new Auth(this.cookie, this.getUser.bind(this), this.disabledUser.bind(this));
  tailwindClasses = {}
  #server = {};

  validateGitRepository(appName, repository) {
    if (!this.gitRepositoryIsValid(repository)) {
      this.throw(`The app ${appName} does not have a valid git repository`);
    }
  }

  get cookie() {
    return this.#cookie;
  }

  set cookie(cookie) {
    this.#cookie = cookie;
  }

  set server(server) {
    this.#server = server;
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

    await this.db.initialize();
    await this.build();
    await this.buildIcons();

    this.tailwindClasses = {};
    await this.setTailwind();
  }

  async setTailwind(toElement, classes) {
    toElement && (this.tailwindClasses[toElement] = classes);
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

    await fileManage.makeFile('public/src', 'tailwind', fn, 'jsx', true);
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
  }

  async buildIcons() {
    if(!this.__installed__) return;
    const refs = this.getRefs();

    
    const evalFields = (fields) => {
      return fields.reduce((acc, field) => {
        if (field.element == ICON_INPUT) {
          acc.push(field.data.name);
        }

        if (field.elements) {
          acc.push(...evalFields(field.elements));
        }

        return acc;
      }, []);
    }

    const refIcons = {};
    Object.values(refs).forEach(ref => {
      if (!ref.is_single){
        const docJson = fileManage.getConfigFile(ref.__NAME__.replaceAll(" ", "-").toLowerCase(), ref.__ROOT__);
        
        if (docJson) {
          const fields = evalFields(JSON.parse(docJson.doc_structure));
          fields.length && (refIcons[ref.__NAME__] = {fields});
        }
      }
    });

    let JSXImports = "";
    const iconImports = new Set();
    for (const [entity, ent] of Object.entries(refIcons)) {
      for (const res of await this.db.getAll(entity, ent.fields)) {
        for(const field of ent.fields) {
          const icon = (res[field] || "").replaceAll(/[- ]/g, '');
          lucideIcons[icon] && iconImports.add(res[field].replaceAll(/[- ]/g, ''));
        }
      }
    }

    JSXImports += `//this file is autogenerated\n export {${[...iconImports].join(',')}} from "lucide-react";`;

    await fileManage.makeFile('public/src', 'iconImport', JSXImports, 'jsx', true);
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

      console.log('Active Web App:', await this.db.getAll("Menu Item", ["*"], { '=': { parent_id: webApp.id } }));
      data.webApp = {
        ...(webApp || {}),
        menu_items: webApp ? await this.db.getAll("Menu Item", ["*"], { '=': { parent_id: webApp.id } }) : [],
        menu_actions: webApp ? await this.db.getAll("Menu Action", ["*"], { '=': { parent_id: webApp.id } }) : []
      }

      await writeModules(data);
    } else {
      await writeFile(data);
    }
  }

  async rebuildVite() {
    console.log('*********Restarting Vite*********');
    await this.server.vite.restart();
    console.log('*********Reloading Browser*********');
    await this.server.vite.ws.send({ type: 'full-reload' });
  }

  async systemsSettings() {
    return await this.getDocument("System Settings");
  }

  async #writeDefaultSSettings() {
    await fileManage.makeFolder('', "config");

    if (!fileManage.existFileSync(path.join('config', 'db.config.json'))) {
      await fileManage.setConfigFile('db.config', {});
    }

    if (!fileManage.existFileSync(path.join('config', 'loopar.config.json'))) {
      await fileManage.setConfigFile('loopar.config', {});
    }

    if (!fileManage.existFileSync(path.join('config', 'server.config.json'))) {
      await fileManage.setConfigFile('server.config', {
        "port": process.env.PORT || 3000,
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
      this.installingApp = null;
      this.printError('LOOPAR: uncaughtException', err);

      try {
        console.log('LOOPAR: render error', err);
        this.server && this.server.renderError({ error: getHttpError(err), redirect: err?.redirect });
      } catch (error) {
        this.printError(['LOOPAR: uncaughtException', err]);
        this.printError(['LOOPAR: uncaughtException produced by', error]);
      }
    });

    global.Crypto = crypto;
    global.AJAX = 'POST';
    global.env = {};
    global.dayjs = dayjs;

    await this.#writeDefaultSSettings();

    env.dbConfig = fileManage.getConfigFile('db.config');
    env.looparConfig = fileManage.getConfigFile('loopar.config', null, {});
    env.serverConfig = fileManage.getConfigFile('server.config');
  }

  throw(error, redirect = null) {
    error = typeof error === 'string' ? { code: 400, message: error } : error
    const err = new Error(error.message);
    err.code = error.code;
    err.redirect = redirect;

    this.#installingApp = null;
    throw err;
  }

  async getUser(user_id=null) {
    if (!this.__installed__ && this.installing) {
      return {
        name: "Administrator"
      }
    }

    return await this.db.knex('tblUser').where({ name: user_id }).orWhere({ email: user_id })
      .select('name', 'email', 'password', 'disabled', 'profile_picture').first();
  }

  async disabledUser(user_id) {
    if (!this.__installed__ && this.installing && user_id === "Administrator") return false;

    const status = await this.db.knex('tblUser').where({ name: user_id }).orWhere({ email: user_id })
      .select('disabled').first();
    
    return !status || status.disabled;
  }

  get currentUser() {
    try {
      return jwt.verify(this.cookie.get('auth_token'), 'user-auth');
    } catch (error) {
      return {};
    }
  }

  async getSettings() {
    this.systemSettings ??= await this.db.getDoc("System Settings", null, ["*"], { isSingle: 1 });
    return this.systemSettings;
  }
}

export const loopar = await new Loopar();