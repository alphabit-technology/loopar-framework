
'use strict';

import {SequelizeORM} from 'db-env';
import sha1 from "sha1";
import * as Helpers from "./global/helper.js";
import * as dateUtils from "./global/date-utils.js";
import { simpleGit, CleanOptions } from 'simple-git';
import { Session, Cookie } from "./server/session.js";
import jwt from 'jsonwebtoken';
import Auth from './auth.js';
import { Document } from './loopar/document.js';
import { tailwinInit, setTailwindTemp } from './loopar/tailwindbase.js';

export class Loopar extends Document {
  #installingApp = false;
  modulesGroup = []
  pathRoot = process.cwd();
  id= "loopar-"+sha1(this.pathRoot);
  pathCore = process.argv[1];
  session = new Session();
  #cookie = new Cookie();
  setTailwindTemp = setTailwindTemp;

  auth = new Auth(
    this.id,
    this.cookie, 
    this.getUser.bind(this),
    this.disabledUser.bind(this)
  );

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
    console.log('Loopar ID:', this.id);
    this.utils = Helpers;
    this.dateUtils = dateUtils;
    await this.buildGlobalEnvironment();
    await this.loadConfig();
    this.db = new SequelizeORM();

    await this.db.initialize();
    await this.build();
    await this.buildIcons();

    await tailwinInit();
  }


  async systemsSettings() {
    return await this.getDocument("System Settings");
  }

 /*  async GlobalEnvironment() {
    GlobalEnvironment();

    process.on('uncaughtException', async err => {
      this.installingApp = null;
      this.printError('LOOPAR: uncaughtException', err);

      try {
        //await this.db.rollbackTransaction();
      } catch (error) {
        this.printError('LOOPAR: uncaughtException rollback error', error);
      }

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
  } */

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

    return await this.db.query('User').where({ name: user_id }).orWhere({ email: user_id })
      .select('name', 'email', 'password', 'disabled', 'profile_picture').first();
  }

  async disabledUser(user_id) {
    if (!this.__installed__ && this.installing && user_id === "Administrator") return false;

    const status = await this.db.query('User').where({ name: user_id }).orWhere({ email: user_id })
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