'use strict';
import { loopar } from './loopar.js';
import { fileManage } from "./file-manage.js";
import multer from "multer";
import WorkspaceController from './controller/workspace-controller.js';
import BaseController from './controller/base-controller.js';
import { getHttpError } from './global/http-errors.js';
import { url } from 'inspector';
import { type } from 'os';

const coreInstallerController = 'installer-controller';

export default class Router {
  debugger = false;

  constructor(options) {
    Object.assign(this, options);

    this.uploader = multer({ storage: multer.memoryStorage() }).any();
  }

  initialize() {

  }

  errTemplate = (err) => {
    return (`
      <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column; background-color: #0b0b0f; color: #95b3d6;">
        <h1 style="font-size: 100px; margin: 0;">${err.code}</h1>
        <h3 style="font-size: 30px; margin: 0;">${err.title}</h3>
        <span style="font-size: 20px; margin: 0;">${err.description}</span>
        <hr style="width: 50%; margin: 20px 0;"/>
        <span style="font-size: 20px; margin: 0;">Loopar</span>
      </div>
    `);
  }

  throw(err, res) {
    const error = getHttpError(err);
    const errString = this.errTemplate(error);

    if (res && !res.headersSent) {
      return res.status(error.code).send(errString);
    }

    return errString;
  }

  render(res, req, response){
    if (!res.headersSent) {
      if(response.hasOwnProperty('redirect')) {
        return this.redirect(res, response.redirect);
      }else{
        res.status(response.status || 200);
        res.setHeader('Content-Type', response.contentType || 'text/html');
        res.send(response.body);
      }
    }
  }

  renderAjax(res, response) {
    //response = typeof response === 'string' ? { message: response } : response;
    if(response){
      const status = parseInt(response.status) || parseInt(response.code) || 200;
      if (!res.headersSent) {
        response = typeof response === 'string' ? { message: response } : response;
        res.status(status);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.send(response);
      }else{
        console.error(["Error on request process, petition cant not send to client", response]);
      }
    }
  }

  async renderError ({ req = this.currentReq, res = this.currentRes, error }) {
    if(!res || res.headersSent) return;

    try {
      if(req.method === 'POST') {
        return this.renderAjax(res, error);
      }else{
        const errControlled = new BaseController({ req, res });
        errControlled.dictUrl = req._parsedUrl;
        const e = await errControlled.getError(error.code, error);
        req.__WORKSPACE__.__DOCUMENT__ = e;

        this.render(res, req, await this.App.render(req.__WORKSPACE__));
      }
    } catch (err) {
      return this.throw(err, res);
    }
  }

  route() {
    this.App = null;
    this.currentRes = null;
    this.currentReq = null;
    this.baseUrl = null;

    const loadHttp = async (req, res, next) => {
      this.currentReq = req;
      this.currentRes = res;
      loopar.cookie.res = res;
      loopar.cookie.cookies = req.cookies;
      loopar.session.req = req;

      /*if (req.files && req.files.length > 0) {
        req.body.reqUploadFiles = req.files;
      }*/

      next();
    }

    const authMiddleware = async (req, res, next) => {
      const params = req.__params__;
      const loginActions = ['login', 'register', 'recovery_user', 'recovery_password'];

      await this.temporaryLogin();

      const isLoginAction = () => {
        return (loginActions || []).includes(params.action);
      }

      if (req.session.user) { /** User is logged */
        if (req._parsedUrl.pathname === "/auth/logout") return next();

        if(params.method === "GET" && req.__WORKSPACE_NAME__ === "auth") return this.redirect(res, '/desk');
        
        //const user = {name: "Administrator", "email": "test"}//loopar.get_user(this.req.session.user.name);
        const user = loopar.getUser(req.session.user.name);

        if (user && user.name !== 'Administrator' && user.disabled) {
          return req.method === 'POST' ? loopar.throw({code: 403, message: 'User is disabled'}) : this.redirect(res, '/auth/logout');
        }

        if (isLoginAction()) {
          return req.method === 'POST' ? loopar.throw({code: 403, message: 'You are already logged in'}) : this.redirect(res, '/desk');
          //return resolve(false);
        //} else if (this.isEnableAction) {
        //  return resolve(true);
        }

        next();
      } else if (isLoginAction()){//} && (this.isFreeAction || this.isEnableAction)) {
        next();
      } else if (/*this.free_access && */req.__WORKSPACE_NAME__ !== 'desk') {
        next();
      }/* else if(this.isFreeAction) {
          resolve(true);
        }*/else {
          return req.method === 'POST' ? loopar.throw({code: 403, message: 'You need to be logged in to access this page'}) : this.redirect(res, '/auth/login');
      }
    }

    const systemMiddleware = async (req, res, next) => {
      const currentUrl = req._parsedUrl.pathname;
      if (!loopar.DBServerInitialized && currentUrl !== "/loopar/installer/connect") {
        /**System detected that Database Server is no Initialized or not Installed */
        return this.redirect(res, '/loopar/installer/connect');
      } else if (
        (!loopar.DBInitialized || !loopar.__installed__) && currentUrl !== "/loopar/installer/install"
      ) {
        /**System not detected a Database */
        return this.redirect(res, '/loopar/installer/install');
      }

      next();
    }

    const workspaceParamsMiddleware = async (req, res, next) => {
      const getWorkspaceName = (url) => {
        const context = url.split("/")[1];
        return ['desk', 'auth', 'api', 'loopar'].includes(context) ? context : 'web';
      }

      req.__WORKSPACE_NAME__ = getWorkspaceName(req._parsedUrl.pathname);

      next();
    }

    const workSpaceMiddleware = async (req, res, next) => {
      if (req.method === 'POST') return next();

      const getWorkspace = async (req, res) => {
        const Controller = new WorkspaceController({ req, res });
        Controller.dictUrl = req._parsedUrl;
        Controller.workspace = req.__WORKSPACE_NAME__;
        this.App = Controller;
        return await Controller.getWorkspace();
      }

      req.__WORKSPACE__ = await getWorkspace(req, res, next);
      next();
    }

    const buildParamsMiddleware = async (req, res, next) => {
      req.__WORKSPACE__ ??= {};
      const url = req._parsedUrl;
      const pathname = ["web","auth"].includes(req.__WORKSPACE_NAME__) ? url.pathname : url.pathname.split("/").slice(1).join("/");

      const routeStructure = { host:null, document: null, action: null };
      const controllerParams = { req, res, dictUrl: url, pathname }

      pathname.split("/").forEach((seg, index) => {
        const RTK = Object.keys(routeStructure)[index];
        routeStructure[RTK] = `${decodeURIComponent(RTK === 'document' ? loopar.utils.Capitalize(seg) : seg || "")}`;
      });

      if (req.__WORKSPACE_NAME__ === "web") {
        routeStructure.action ??= "view";
        routeStructure.document ??= "Home";
        controllerParams.action = routeStructure.action;
      }

      controllerParams.method = req.method;
      req.__params__ = { ...routeStructure, ...controllerParams };

      next();
    }

    const controllerMiddleware = async (req, res, next) => {
      await this.makeController(req, res);
      let response = req.__WORKSPACE__.__DOCUMENT__;
      
      if(typeof response == Object && response.hasOwnProperty('redirect')) {
        return this.redirect(res, response.redirect);
      }

      if (req.method === 'POST') {
        return this.renderAjax(res, response);
      } else {
        next();
      }
    }

    const fynalyMiddleware = async (req, res) => {
      this.render(res, req, await this.App.render(req.__WORKSPACE__));
    }

    const assetMiddleware = (req, res, next) => {
      this.currentReq = null;
      this.currentRes = null;
      // List of common asset file extensions (images, multimedia, fonts, web files, documents, compressed files, data files)
      const assetExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', // Images
        'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac', // Multimedia
        'woff', 'woff2', 'ttf', 'eot', 'otf', // Fonts
        'js', 'mjs', 'jsx', 'css', 'html', 'htm', // Web files
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', // Documents
        'zip', 'rar', '7z', 'tar', 'gz', 'bz2', // Compressed files
        'json', 'xml', 'txt' // Data files
      ];

      const isAsset = () => {
        const url = req._parsedUrl.pathname;

        // Exclude routes that are clearly APIs or non-asset endpoints
        if (url.includes("/api/") || url.includes("/admin/")) return false;

        // Extract the file extension from the URL
        const extensionMatch = url.split('.').pop();

        // If there's no extension or the extension is not in the asset list, it's not an asset
        if (!extensionMatch || !assetExtensions.includes(extensionMatch.toLowerCase())) return false;

        // If the extension matches the asset list, it is considered an asset
        return true;
      };

      req.isAssetUrl = isAsset();
      next();
    };

    const notFoundSourceMiddleware = (req, res, next) => {
      if (!req.isAssetUrl) return next();

      const errString = this.errTemplate({
        code: 404,
        title: "Source not found",
        description: req.url
      });
      
      res.status(404).send(errString);
    }

    this.server.use(assetMiddleware, notFoundSourceMiddleware);
    this.server.use(loadHttp, systemMiddleware, workspaceParamsMiddleware, buildParamsMiddleware, authMiddleware, workSpaceMiddleware/*, uploaderMiddleware*/, controllerMiddleware, fynalyMiddleware);

  }

  async makeController(req, res) {
    const params = req.__params__;

    if (!params.action || !params.document === "Module") {
      params.name = params.document;
      params.document = 'Module'; //Because Module is the Entity
      params.action ??= 'view'; //Because in ModuleController the default action is view
    }

    if (req.__WORKSPACE_NAME__ === "web") {
      const webApp = loopar.webApp || { menu_items: [] };
      params.document ??= "Home";
      const menu = webApp.menu_items.find(item => item.link === params.document);

      if (!webApp.name || !menu) {
        return loopar.throw({code: 404, message: !webApp.name ? "Web App not found" : "Page not found"});
      } else {
        params.document = menu.page;
      }
    }

    const ref = loopar.getRef(params.document);

    if (!ref) return loopar.throw({code: 404, message: `Document ${params.document} not found`}, res);

    const makeController = async (query, body) => {
      const C = await fileManage.importClass(loopar.makePath(ref.entityRoot, `${params.document}Controller.js`));

      const Controller = new C({
        ...params, ...query, data: body
      });

      const action = params.action && params.action.length > 0 ? params.action : Controller.defaultAction;
      req.__WORKSPACE__.__DOCUMENT__ = await Controller.sendAction(action);
    }

    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
      return new Promise(resolve => {
        this.uploader(req, res, async err => {
          if (err) loopar.throw(err, res);

          resolve(await makeController(req.query, req.body));
        });
      });
    } else {
      return await makeController(req.query, req.body);
    }
  }

  async temporaryLogin() {
    return new Promise(resolve => {
      loopar.session.set('user', {
        name: "Administrator",
        email: "mail@mail.com",
        avatar: "AD",
        profile_picture: "",
      }, resolve());
    });
  }

  redirect(res, url) {
    if(!res.headersSent) res.redirect(url || '/desk');
  }
}