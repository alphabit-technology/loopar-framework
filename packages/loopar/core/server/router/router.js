'use strict';
import { loopar } from '../../loopar.js';
import { fileManage } from "../../file-manage.js";
import multer from "multer";
import WorkspaceController from '../../controller/workspace-controller.js';
import BaseController from '../../controller/base-controller.js';
import { getHttpError } from '../../global/http-errors.js';
import { RouterUtils } from './router-utils.js';

export default class Router {
  debugger = false;

  constructor(options) {
    Object.assign(this, options);
    this.uploader = multer({ storage: multer.memoryStorage() }).any();
  }

  /**
   * Generates error template using RouterUtils
   * @param {Object} err - Error object
   * @returns {string} HTML error template
   */
  errTemplate = (err) => RouterUtils.generateErrorTemplate(err);

  /**
   * Throws and handles errors
   * @param {*} err - Error to throw
   * @param {Object} res - Express response object
   * @returns {string} Error string
   */
  throw(err, res) {
    console.log(["Router Error", err]);
    const error = getHttpError(err);
    const errString = this.errTemplate(error);

    if (res && !res.headersSent) {
      return res.status(error.code).send(errString);
    }

    return errString;
  }

  /**
   * Renders HTML response
   * @param {Object} res - Express response object
   * @param {Object} response - Response data
   */
  render(res, response) {
    if (res.headersSent) return;

    if (response?.redirect) {
      return this.redirect(res, response.redirect);
    }
    
    res.status(response.status || 200);
    res.setHeader('Content-Type', response.contentType || 'text/html');
    res.send(response.body);
  }

  /**
   * Renders AJAX/JSON response
   * @param {Object} res - Express response object
   * @param {*} response - Response data
   */
  renderAjax(res, response) {
    if (!response || res.headersSent) {
      if (!response) return;
      console.error(["Error on request process, petition cant not send to client", response]);
      return;
    }

    const status = parseInt(response.status) || parseInt(response.code) || 200;
    const responseData = typeof response === 'string' ? { message: response } : response;
    
    res.status(status);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.send(responseData);
  }

  /**
   * Renders error responses
   * @param {Object} options - Error rendering options
   */
  async renderError({ req = this.currentReq, res = this.currentRes, error, redirect }) {
    if (!res || res.headersSent) return;

    try {
      if (req.method === 'POST') {
        return this.renderAjax(res, error);
      }
      
      if (redirect && req._parsedUrl.pathname !== redirect) {
        return this.redirect(res, redirect);
      }
      
      const errControlled = new BaseController({ req, res });
      errControlled.dictUrl = req._parsedUrl;
      const e = await errControlled.getError(error.code, error);
      req.__WORKSPACE__.__DOCUMENT__ = e;
      req.__WORKSPACE__.__DOCUMENT__.__DOCUMENT_TITLE__ = error.title;

      this.render(res, await this.App.render(req.__WORKSPACE__));
    } catch (err) {
      return this.throw(err, res);
    }
  }

  /**
   * Sets up HTTP loading middleware
   * @returns {Function} Middleware function
   */
  setupLoadHttpMiddleware() {
    return async (req, res, next) => {
      this.currentReq = req;
      this.currentRes = res;
      loopar.cookie.res = res;
      loopar.cookie.cookies = req.cookies;
      loopar.session.req = req;
      next();
    };
  }

  /**
   * Sets up system validation middleware
   * @returns {Function} Middleware function
   */
  setupSystemMiddleware() {
    return async (req, res, next) => {
      const currentUrl = req._parsedUrl.pathname;
      const status = RouterUtils.SystemValidation.getStatus(loopar);

      if (status.needsConnect && currentUrl !== status.connectPath) {
        return this.redirect(res, status.connectPath);
      }

      if (status.needsInstallOrUpdate) {
        const redirectPath = status.needsUpdate ? status.updatePath : status.installPath;
        if (currentUrl !== redirectPath) {
          return this.redirect(res, redirectPath);
        }
      }

      // Set workspace name
      req.__WORKSPACE_NAME__ = RouterUtils.getWorkspaceName(currentUrl);

      if (status.isFullyInstalled && req.__WORKSPACE_NAME__ === "loopar") {
        return this.redirect(res, '/desk');
      }

      next();
    };
  }

  /**
   * Sets up workspace middleware
   * @returns {Function} Middleware function
   */
  setupWorkspaceMiddleware() {
    return async (req, res, next) => {
      if (req.method === 'POST') return next();

      const Controller = new WorkspaceController({ 
        req, 
        res, 
        method: req.method 
      });
      Controller.dictUrl = req._parsedUrl;
      Controller.workspace = req.__WORKSPACE_NAME__;

      this.App = Controller;
      req.__WORKSPACE__ = await Controller.getWorkspace();
      next();
    };
  }

  /**
   * Sets up parameter building middleware
   * @returns {Function} Middleware function
   */
  setupBuildParamsMiddleware() {
    return (req, res, next) => {
      if (req.tryToServePrivateFile) return next();
      
      req.__WORKSPACE__ ??= {};
      const url = req._parsedUrl;

      const routeStructure = RouterUtils.RouteParsing.parseParams(
        url.pathname, 
        req.__WORKSPACE_NAME__, 
        loopar
      );

      const controllerParams = { 
        req, 
        res, 
        dictUrl: url, 
        pathname: ["web", "auth"].includes(req.__WORKSPACE_NAME__) 
          ? url.pathname 
          : url.pathname.split("/").slice(1).join("/"),
        method: req.method 
      };

      if (req.__WORKSPACE_NAME__ === "web") {
        routeStructure.action ??= "view";
        routeStructure.document ??= "Home";
        controllerParams.action = routeStructure.action;
      }

      req.__params__ = { ...routeStructure, ...controllerParams };

      next();
    };
  }

  /**
   * Sets up controller middleware
   * @returns {Function} Middleware function
   */
  setupControllerMiddleware() {
    return async (req, res, next) => {
      await this.makeController(req, res);
      const response = req.__WORKSPACE__.__DOCUMENT__;

      if (response?.redirect) {
        return this.redirect(res, response.redirect);
      }

      if (req.method === 'POST') {
        return this.renderAjax(res, response);
      }
      
      next();
    };
  }

  /**
   * Sets up final rendering middleware
   * @returns {Function} Middleware function
   */
  setupFinalMiddleware() {
    return async (req, res) => {
      this.render(res, await this.App.render(req.__WORKSPACE__));
    };
  }

  /**
   * Sets up asset detection middleware
   * @returns {Function} Middleware function
   */
  setupAssetMiddleware() {
    return (req, res, next) => {
      this.currentReq = null;
      this.currentRes = null;
      
      req.isAssetUrl = RouterUtils.isAssetUrl(req._parsedUrl.pathname);
      next();
    };
  }

  /**
   * Sets up not found source middleware
   * @returns {Function} Middleware function
   */
  setupNotFoundSourceMiddleware() {
    return (req, res, next) => {
      if (!req.isAssetUrl) return next();

      req.tryToServePrivateFile = true;

      const errString = this.errTemplate({
        code: 404,
        title: "Source not found",
        description: req.url
      });

      res.status(404).send(errString);
    };
  }

  /**
   * Sets up all routes and middleware
   */
  route() {
    // Initialize properties
    this.App = null;
    this.currentRes = null;
    this.currentReq = null;
    this.baseUrl = null;

    // Setup middleware chain
    this.server.use(
      this.setupAssetMiddleware(), 
      this.setupNotFoundSourceMiddleware()
    );
    
    this.server.use(
      this.setupLoadHttpMiddleware(),
      this.setupSystemMiddleware(),
      this.setupBuildParamsMiddleware(),
      this.setupWorkspaceMiddleware(),
      this.setupControllerMiddleware(),
      this.setupFinalMiddleware()
    );
  }

  /**
   * Creates and executes controller
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async makeController(req, res) {
    const params = req.__params__;

    if (req.tryToServePrivateFile) {
      return await this.handlePrivateFile(req, res);
    }

    // Set default parameters using helper
    RouterUtils.setDefaultParams(params, req.__WORKSPACE_NAME__);

    // Handle web workspace
    if (req.__WORKSPACE_NAME__ === "web") {
      const menu = RouterUtils.RouteParsing.findWebAppMenu(params.document, loopar);
      if (!menu) {
        return loopar.throw({ 
          code: 404, 
          message: !loopar.webApp?.name ? "Web App not found" : "Page not found" 
        });
      }
      params.document = menu.page;
    }

    const ref = loopar.getRef(loopar.utils.Capitalize(params.document), false);
    
    if (!ref) {
      return await this.handleDocumentNotFound(req, res, params);
    }

    params.document = ref.__NAME__;

    return await this.executeController(req, res, params, ref);
  }

  /**
   * Handles private file serving
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async handlePrivateFile(req, res) {
    const errControlled = new BaseController({ req, res });
    errControlled.dictUrl = req._parsedUrl;
    const e = await errControlled.servePrivateFile("logo-test.png");
    req.__WORKSPACE__.__DOCUMENT__ = e;
    return this.render(res, await this.App.render(req.__WORKSPACE__, true));
  }

  /**
   * Handles document not found errors
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} params - Request parameters
   */
  async handleDocumentNotFound(req, res, params) {
    if (req.method === 'POST') {
      return this.renderAjax(res, { 
        code: 404, 
        message: `Document ${params.document} not found` 
      });
    }

    const errControlled = new BaseController({ req, res });
    errControlled.dictUrl = req._parsedUrl;
    const e = await errControlled.getError(404, { 
      title: "Not found", 
      message: `Document ${params.document} not found` 
    });
    req.__WORKSPACE__.__DOCUMENT__ = e;
    return this.render(res, await this.App.render(req.__WORKSPACE__, true));
  }

  /**
   * Executes controller logic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} params - Request parameters
   * @param {Object} ref - Document reference
   */
  async executeController(req, res, params, ref) {
    const makeController = async (query, body) => {
      const C = await fileManage.importClass(
        loopar.makePath(ref.__ROOT__, `${params.document}Controller.js`)
      );

      const Controller = new C({
        ...params,
        ...query,
        data: RouterUtils.prepareFileData(body, req.files),
        __REQ_FILES__: req.files,
      });

      const action = params.action?.length > 0 ? params.action : Controller.defaultAction;
      Controller.action = action;

      const result = await Controller.sendAction(action) || {};
      req.__WORKSPACE__.__DOCUMENT__ = result;
      
      if (result && typeof result === "object") {
        req.__WORKSPACE__.__DOCUMENT__.__MODULE__ = ref?.__MODULE__;
      }
    };

    const contentType = req.headers['content-type'];
    const isMultipart = RouterUtils.isMultipartFormData(contentType);

    if (isMultipart) {
      return new Promise(resolve => {
        this.uploader(req, res, async err => {
          if (err) {
            console.log(["Multer Error", err]);
            loopar.throw(err);
          }
          return resolve(await makeController(req.query, req.body));
        });
      });
    }

    return await makeController(req.query, req.body);
  }

  /**
   * Creates URL using RouterUtils
   * @param {string} href - The href to process
   * @param {string} currentURL - The current URL
   * @returns {string} The built URL
   */
  makeUrl = (href, currentURL) => RouterUtils.buildUrl(href, currentURL);

  /**
   * Redirects to specified URL
   * @param {Object} res - Express response object
   * @param {string} url - URL to redirect to
   */
  redirect(res, url) {
    if (res.headersSent) return;
    
    const redirectUrl = this.makeUrl(url, this.currentReq._parsedUrl.pathname);
    res.redirect(redirectUrl || '/desk');
  }
}