'use strict';
import { loopar } from './loopar.js';
import { fileManage } from "./file-manage.js";
import multer from "multer";
import WorkspaceController from './controller/workspace-controller.js';
import BaseController from './controller/base-controller.js';
import { getHttpError } from './global/http-errors.js';

export default class Router {
  debugger = false;

  constructor(options) {
    Object.assign(this, options);

    this.uploader = multer({ storage: multer.memoryStorage() }).any();
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
    console.log(["Router Error", err]);
    const error = getHttpError(err);
    const errString = this.errTemplate(error);

    if (res && !res.headersSent) {
      return res.status(error.code).send(errString);
    }

    return errString;
  }

  render(res, response) {
    if (!res.headersSent) {
      if (response.hasOwnProperty('redirect')) {
        return this.redirect(res, response.redirect);
      } else {
        res.status(response.status || 200);
        res.setHeader('Content-Type', response.contentType || 'text/html');
        res.send(response.body);
      }
    }
  }

  renderAjax(res, response) {
    if (response) {
      const status = parseInt(response.status) || parseInt(response.code) || 200;
      if (!res.headersSent) {
        response = typeof response === 'string' ? { message: response } : response;
        res.status(status);
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        res.send(response);
      } else {
        console.error(["Error on request process, petition cant not send to client", response]);
      }
    }
  }

  async renderError({ req = this.currentReq, res = this.currentRes, error, redirect }) {
    if (!res || res.headersSent) return;

    try {
      if (req.method === 'POST') {
        return this.renderAjax(res, error);
      } else {
        if (redirect && req._parsedUrl.pathname !== redirect) {
          return this.redirect(res, redirect);
        }
        const errControlled = new BaseController({ req, res });
        errControlled.dictUrl = req._parsedUrl;
        const e = await errControlled.getError(error.code, error);
        req.__WORKSPACE__.__DOCUMENT__ = e;
        req.__WORKSPACE__.__DOCUMENT__.__DOCUMENT_TITLE__ = error.title;

        this.render(res, await this.App.render(req.__WORKSPACE__));
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

      next();
    }

    const systemMiddleware = async (req, res, next) => {
      const currentUrl = req._parsedUrl.pathname;
      const { DBServerInitialized, DBInitialized, __installed__ } = loopar;

      if (!DBServerInitialized && currentUrl != "/loopar/system/connect") {
        /**System detected that Database Server is no Initialized or not Installed */
        return this.redirect(res, '/loopar/system/connect');
      }

      if (DBServerInitialized && (!DBInitialized || !loopar.__installed__)) {
        /**System not detected a Database */
        if (loopar.db.database) {
          if (currentUrl != "/loopar/system/update") {
            return this.redirect(res, '/loopar/system/update');
          }
        } else {
          if (currentUrl != "/loopar/system/install") {
            return this.redirect(res, '/loopar/system/install');
          }
        }
        //return this.redirect(res, '/loopar/system/install');
      }

      workspaceParamsMiddleware(req, res, next);

      if (DBServerInitialized && DBInitialized && __installed__ && req.__WORKSPACE_NAME__ === "loopar") {
        /**System is Installed */
        return this.redirect(res, '/desk');
      }

      next();
    }

    const workspaceParamsMiddleware = async (req, res, next) => {
      const getWorkspaceName = (url) => {
        const context = url.split("/")[1];
        return ['desk', 'auth', 'loopar'].includes(context) ? context : 'web';
      }

      req.__WORKSPACE_NAME__ = getWorkspaceName(req._parsedUrl.pathname);
    }

    const workSpaceMiddleware = async (req, res, next) => {
      if (req.method === 'POST') return next();

      const getWorkspace = async (req, res) => {
        const Controller = new WorkspaceController({ req, res, method: req.method });
        Controller.dictUrl = req._parsedUrl;
        Controller.workspace = req.__WORKSPACE_NAME__;

        this.App = Controller;
        return await Controller.getWorkspace();
      }

      req.__WORKSPACE__ = await getWorkspace(req, res, next);
      next();
    }

    const buildParamsMiddleware = async (req, res, next) => {
      if(req.tryToServePrivateFile) return next();
      req.__WORKSPACE__ ??= {};
      const url = req._parsedUrl;
      const pathname = ["web", "auth"].includes(req.__WORKSPACE_NAME__) ? url.pathname : url.pathname.split("/").slice(1).join("/");

      const routeStructure = { host: null, document: null, action: null };
      const controllerParams = { req, res, dictUrl: url, pathname }

      pathname.split("/").forEach((seg, index) => {
        const RTK = Object.keys(routeStructure)[index];
        if (seg && seg.length > 0)
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

      if (typeof response == "object" && response.hasOwnProperty('redirect')) {
        return this.redirect(res, response.redirect);
      }

      if (req.method === 'POST') {
        return this.renderAjax(res, response);
      } else {
        next();
      }
    }

    const fynalyMiddleware = async (req, res) => {
      this.render(res, await this.App.render(req.__WORKSPACE__));
    }

    const assetMiddleware = (req, res, next) => {
      this.currentReq = null;
      this.currentRes = null;
      // List of common asset file extensions (images, multimedia, fonts, web files, documents, compressed files, data files)
      const assetExtensions = [
        'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', // Images
        'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac', // Multimedia
        'woff', 'woff2', 'ttf', 'eot', 'otf', // Fonts
        'js', 'mjs', 'jsx', 'css', 'html', 'htm', 'xhtml', // Web files
        'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', // Documents
        'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'gzip', 'br', // Compressed files
        'json', 'xml', 'txt', 'yaml' // Data files
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

      /**In this point system detect that file es not a public source, else the system will be try to server private file */
      req.tryToServePrivateFile = true;

      return next();
      const errString = this.errTemplate({
        code: 404,
        title: "Source not found",
        description: req.url
      });

      res.status(404).send(errString);
    }

    this.server.use(assetMiddleware, notFoundSourceMiddleware);
    this.server.use(loadHttp, systemMiddleware, buildParamsMiddleware, workSpaceMiddleware/*, uploaderMiddleware*/, controllerMiddleware, fynalyMiddleware);

  }

  async makeController(req, res) {
    const params = req.__params__;
    
    if(req.tryToServePrivateFile) {
      /*if (req.method === 'POST') {
        return this.renderAjax(res, { code: 404, message: `Document ${params.document} not found` });
      }*/

      //  console.log(["Try to server private file", params]);

      const errControlled = new BaseController({ req, res });
      errControlled.dictUrl = req._parsedUrl;
      const e = await errControlled.servePrivateFile("logo-test.png");
      req.__WORKSPACE__.__DOCUMENT__ = e;
      return this.render(res, await this.App.render(req.__WORKSPACE__, true));

      //return this.App.servePrivateFile(req, res);
    }

    if (!params.document && !params.action && req.__WORKSPACE_NAME__ === 'desk') {
      params.document = "Desk";
      params.action = "view";
    }

    if (!params.action || !params.document) {
      params.name = params.document;
      params.document = 'Module'; //Because Module is the Entity
      params.action ??= 'view'; //Because in ModuleController the default action is view
    }

    if (req.__WORKSPACE_NAME__ === "web") {
      const webApp = loopar.webApp || { 
        menu_items: [],
        action_items: [],
      };
      const menu = (webApp.menu_items || []).find(item => item.link === params.document);

      if (!webApp.name || !menu)
        return loopar.throw({ code: 404, message: !webApp.name ? "Web App not found" : "Page not found" });

      params.document = menu.page;
    }

    const ref = loopar.getRef(params.document, false);

    if (!ref) {
      if (req.method === 'POST') {
        return this.renderAjax(res, { code: 404, message: `Document ${params.document} not found` });
      }

      const errControlled = new BaseController({ req, res });
      errControlled.dictUrl = req._parsedUrl;
      const e = await errControlled.getError(404, { title: "Not found", message: `Document ${params.document} not found` });
      req.__WORKSPACE__.__DOCUMENT__ = e;
      return this.render(res, await this.App.render(req.__WORKSPACE__, true));
    }

    const makeController = async (query, body) => {
      const C = await fileManage.importClass(loopar.makePath(ref.__ROOT__, `${params.document}Controller.js`));

      const Controller = new C({
        ...params, 
        ...query, 
        data: { ...body, ...(req.files && req.files.length > 0 ? { __REQ_FILES__: req.files} : {}) },
        __REQ_FILES__: req.files,
      });

      const action = params.action && params.action.length > 0 ? params.action : Controller.defaultAction;
      Controller.action = action;
      req.__WORKSPACE__.__DOCUMENT__ = await Controller.sendAction(action) || {};
      req.__WORKSPACE__.__DOCUMENT__.__MODULE__ = ref.__MODULE__
    }

    if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
      return new Promise(resolve => {
        this.uploader(req, res, async err => {
          if (err) console.log(["Multer Error", err]);
          if (err) loopar.throw(err);

          return resolve(await makeController(req.query, req.body));
        });
      });
    } else {
      return await makeController(req.query, req.body);
    }
  }

  makeUrl = (href, currentURL) => {
    if (href.startsWith("http") || href.startsWith("/")) return href;

    const urlStructure = ["workspace", "document", "action"];
    const urlArray = currentURL.split("/");

    const urlObject = {};
    urlStructure.forEach((key, index) => {
      urlObject[key] = urlArray[index + 1];
    });

    const [baseUrl, queryString] = href.split("?");
    const baseUrlSegments = baseUrl.split("/").reverse();

    urlStructure.reverse().forEach((key, index) => {
      urlObject[key] = baseUrlSegments[index] || urlObject[key];
    });

    return `/${Object.values(urlObject).filter(e => e && e !== "").join("/")}${queryString ? "?" + queryString : ""}`;
  }

  redirect(res, url) {
    url = this.makeUrl(url, this.currentReq._parsedUrl.pathname);
    if (!res.headersSent) res.redirect(url || '/desk');
  }
}