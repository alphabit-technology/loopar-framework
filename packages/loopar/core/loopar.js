'use strict';

import {SequelizeORM} from 'db-env';
import sha1 from "sha1";
import * as Helpers from "./global/helper.js";
import * as dateUtils from "./global/date-utils.js";
import { simpleGit, CleanOptions } from 'simple-git';
import jwt from 'jsonwebtoken';
import Auth from './auth.js';
import { Document } from './loopar/document.js';
import { tailwinInit, setTailwindTemp } from './loopar/tailwindbase.js';
import { Server } from './server/server.js';
import { fileManage } from './file-manage.js';
import { cookieManager, sessionManager } from './server/router/request-context.js';
import { markdownRenderer } from "markdown";

export class Loopar extends Document {
  #installingApp = false;
  modulesGroup = []
  pathRoot = process.cwd();
  markdownRenderer = markdownRenderer;
  renderMarkdownSSR
  utils = Helpers;
  __INSTALLED_APPS__

  constructor() {
    super("Loopar");
    
    this.dateUtils = dateUtils;
    this.server = new Server();
    this.db = new SequelizeORM();
  }

  async init({
    tenantId,
    appsBasePath
  }){
    this.tenantId = tenantId;
    this.tenantPath = this.makePath(this.pathRoot, "sites", tenantId);
    this.pathCore = `${process.cwd()}/packages/loopar`
    this.id = "loopar-"+sha1(tenantId);
    this.appsBasePath = appsBasePath;

    this.auth = new Auth(
      this.authTokenName,
      this.getUser.bind(this),
      this.disabledUser.bind(this)
    );
    
    await this.initialize();

    await this.server.initialize();
  }

  async initialize() {
    console.log(`......Initializing Loopar....... [${this.id}]` );
    
    await this.buildGlobalEnvironment();
    await this.loadConfig();
   
    await this.db.initialize();
    await this.build();
    await this.buildIcons();

    await tailwinInit(this.tenantId);
  }
  
  get authTokenName() {
    return this.id;
  }

  get jwtSecret() {
    return sha1(this.id);
  }

  #server = {};

  validateGitRepository(appName, repository) {
    if (!this.gitRepositoryIsValid(repository)) {
      this.throw(`The app ${appName} does not have a valid git repository`);
    }
  }

  get cookie() {
    return cookieManager;
  }

  get session() {
    return sessionManager;
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

  get installedApps(){
    this.__INSTALLED_APPS__ ??= fileManage.getConfigFile("installed-apps");
    return this.__INSTALLED_APPS__
  }

  async setApp(app) {
    await fileManage.setConfigFile('installed-apps', {...this.installedApps, ...app});
    this.__INSTALLED_APPS__ = fileManage.getConfigFile("installed-apps");
  }

  async unsetApp(app){
    const installedApps = this.installedApps;
    delete installedApps[app];
    await fileManage.setConfigFile('installed-apps', installedApps);
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

  #dbConfig = null;

  getDbConfig() {
    if (this.#dbConfig) return this.#dbConfig;
   
    this.#dbConfig = fileManage.getConfigFile('db.config');
    return this.#dbConfig;
  }

  async setDbConfig(config) {
    this.#dbConfig = config;
    return await fileManage.setConfigFile('db.config', config);
  }

  async systemsSettings() {
    return await this.getDocument("System Settings");
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

    return await this.db.query('User').where({ name: user_id }).orWhere({ email: user_id })
      .select('name', 'email', 'password', 'disabled', 'profile_picture').first();
  }

  async disabledUser(user_id) {
    if ((!this.__installed__ || this.installing) || (user_id === "Administrator")) return false;

    const status = await this.db.query('User').where({ name: user_id }).orWhere({ email: user_id })
      .select('disabled').first();
    
    return !status || status.disabled === 1 || status.disabled === '1'
  }

  get currentUser() {
    try {
      const token = this.cookie.get(this.authTokenName);
      
      if (!token) return {};
      
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      console.error(['[currentUser] Error:', error.message]);
      return {};
    }
  }

  async getSettings() {
    this.systemSettings ??= await this.db.getDoc("System Settings", null, ["*"], { isSingle: 1 });
    return this.systemSettings;
  }
}

export const loopar = new Loopar();