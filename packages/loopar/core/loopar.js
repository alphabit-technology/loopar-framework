'use strict';

import {KnexORM} from 'db-env';
import sha1 from "sha1";
import * as Helpers from "./global/helper.js";
import * as dateUtils from "./global/date-utils.js";
import { simpleGit, CleanOptions } from 'simple-git';
import jwt from 'jsonwebtoken';
import Auth from './auth/Auth.js';
import { Document } from './loopar/document.js';
import { tailwinInit } from './loopar/tailwindbase.js';
import { Server } from './server/server.js';
import { fileManage } from './file-manage.js';
import { cookieManager, sessionManager } from './server/router/request-context.js';
import { markdownRenderer } from "markdown";
import {EmailService} from "./email.js"
import { cacheManager } from './cache/cache-manager.js';
import { RealtimeManager } from './realtime/RealtimeManager.js';
import { HookManager } from "./HookManager.js";
import { setupDocumentHistory } from "./document/document-history.js";
import { StorageManager } from "./global/storage/index.js";
import argon2 from 'argon2';


export class Loopar extends Document {
  #installingApp = false;
  modulesGroup = []
  pathRoot = process.cwd();
  markdownRenderer = markdownRenderer;
  renderMarkdownSSR
  utils = Helpers;
  __INSTALLED_APPS__
  hookManager = new HookManager();

  constructor() {
    super("Loopar");
    
    this.ORM = KnexORM;
    this.dateUtils = dateUtils;
    this.server = new Server();
    this.db = new this.ORM();
    this.storage = new StorageManager();

    setupDocumentHistory(this, KnexORM);
  }

  hook(document, event, callback) {
    this.hookManager.register(document, event, callback);
  }

  emit(event, payload = null) {
    const [room, action] = event.includes(":")
      ? event.split(":")
      : ["__global__", event];
  
    const data = {
      ...(payload && typeof payload === 'object' ? payload : { data: payload }),
      user: this.auth?.user() ?? null,
    };
  
    RealtimeManager.emit(this.tenantId, room, action, data);
  }

  async init({
    tenantId,
    appsBasePath
  }){
    this.hookManager.attach(this.ORM);
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
    await cacheManager.initialize(this);
    await this.db.initialize();
    await this.build();
    try {
      await this.buildIcons();
    } catch (error) {
      console.log(["Err on build Icons", error])
    }
    
    this.mail = new EmailService()

    await tailwinInit(this.tenantId);

    await this.#bootstrapStorage();
  }

  async #bootstrapStorage() {
    try {
      const activeName = await this.#resolveActiveStorageName();
      if (!activeName) {
        this.storage.setActive('local');
        return;
      }

      const doc = await this.getDocument(activeName, null, null, { ifNotFound: null });
      if (!doc || typeof doc.buildDriver !== 'function') {
        console.warn(`[storage] "${activeName}" is not a valid storage provider; using local.`);
        this.storage.setActive('local');
        return;
      }

      const driver = await doc.buildDriver();
      this.storage.activateDriver(driver);
    } catch (err) {
      console.log('[storage] bootstrap skipped:', err?.message || err);
      this.storage.setActive('local');
    }
  }

  async #resolveActiveStorageName() {
    return (await this.getSettings())?.active_storage || null;
  }

  async applyStorage() {
    await this.#bootstrapStorage();
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

  async hash (plain){
    if (!plain) return null;
    return argon2.hash(plain, { type: argon2.argon2id });
  };

  async verifyHash(plain, stored){
    if (!plain || !stored) return false;
  
    try {
      if (stored.startsWith('$argon2')) {
        return await argon2.verify(stored, plain);
      }

      return sha1(plain) === stored;
    } catch (e) {
      console.error('[verifyHash] Error:', e.message);
      return false;
    }
  };

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
    // With redirects are always auth / session / csrf failures:
    // force hard reload to discard client state (csrf, user,
    // cached permissions) and do a clean bootstrap.
    err.hardRedirect = redirect ? true : false;

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

  /**
   * Filesystem roots that back `/assets/{visibility}/` URLs.
   *
   * `Server#exposePublicDirectories` mounts `express.static` on these
   * (in this order) so the framework can serve user-uploaded files
   * regardless of which scope they belong to. The asset middleware
   * uses the same list to locate mirror `.meta.json` files for assets
   * whose binary lives in a remote driver (Cloudinary / Reference).
   *
   * Single source of truth — if you add a new scope (e.g. plugins),
   * extend this method and both the static dispatcher and the
   * middleware pick it up automatically.
   */
  getAssetRoots(visibility = 'public') {
    const uploadPath = 'uploads';
    const roots = [
      this.makePath(this.pathRoot, visibility),
      this.makePath(this.pathRoot, uploadPath, visibility),
      this.makePath(this.tenantPath, visibility),
      this.makePath(this.tenantPath, uploadPath, visibility),
    ];
    if (this.__installed__ && this.installedApps) {
      for (const app of Object.keys(this.installedApps)) {
        roots.push(this.makePath(this.pathRoot, 'apps', app, uploadPath, visibility));
      }
    }
    return roots;
  }

  /**
   * Path where an asset's binary AND its mirror live, given the
   * asset's `app` scope. Returns:
   *   apps/{app}/uploads/{visibility}/     when scoped to an app
   *   {tenant}/uploads/{visibility}/       otherwise
   *
   * Mirror files (`.meta.json`) and physical binaries (when the
   * driver is local) live side-by-side under this path so a single
   * directory tree contains everything Loopar knows about an asset.
   */
  getAssetPath({ app, visibility = 'public' } = {}) {
    const uploadPath = 'uploads';
    if (app && app.length > 0) {
      return this.makePath(this.pathRoot, 'apps', app, uploadPath, visibility);
    }
    return this.makePath(this.tenantPath, uploadPath, visibility);
  }

  /**
   * Extracts method names that start with "action" from a class,
   * walking up the prototype chain but stopping at BaseController
   * to avoid including framework-level actions.
   *
   * Returns names without the "action" prefix, lowercased first char.
   * e.g. "actionCreate" → "create"
   *
   * @param {Function} ControllerClass
   * @returns {string[]}
   */
  extractControllerMethods(ControllerClass, diff) {
    const actions = new Set();
    let proto = ControllerClass.prototype;
    let isOwner = true;
    let currentFilter = null;
  
    while (
      proto &&
      (!diff || proto.constructor?.name !== diff) &&
      proto !== Object.prototype
    ) {
      for (const key of Object.getOwnPropertyNames(proto)) {
        const descriptor = Object.getOwnPropertyDescriptor(proto, key);

        if (!descriptor || descriptor.get || descriptor.set) continue;
        if (typeof descriptor.value !== 'function') continue;
  
        if (key.startsWith('publicAction') && key.length > 12) {
          actions.add(key);
        } else if (key.startsWith('privateAction') && key.length > 13) {
          if (isOwner) actions.add(key);
        } else if (key.startsWith('action') && key.length > 6) {
          const name = key.charAt(6).toLowerCase() + key.slice(7);
          if (isOwner) {
            actions.add(key);
          } else if (currentFilter === null || currentFilter.includes(name)) {
            actions.add(key);
          }
        }
      }
  
      const thisInherited = proto.constructor?.inheritedActions ?? null;
  
      if (isOwner) {
        currentFilter = thisInherited;
      } else if (thisInherited !== null) {
        currentFilter = currentFilter === null
          ? thisInherited
          : currentFilter.filter(a => thisInherited.includes(a));
      }
  
      proto   = Object.getPrototypeOf(proto);
      isOwner = false;
    }
  
    return [...actions];
  }
}

export const loopar = new Loopar();