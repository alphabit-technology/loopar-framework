import { loopar } from '../../loopar.js';
import { RouterUtils } from './router-utils.js';
import WorkspaceController from '../../controller/workspace-controller.js';
import { getHttpError } from '../../global/http-errors.js';
import BaseController from '../../controller/base-controller.js';
import { merge } from 'es-toolkit/object';
import { requestContext } from './request-context.js';

export class Middleware {
  constructor(options) {
    Object.assign(this, options);
  }

  /**
   * Sets up request context middleware using AsyncLocalStorage
   * This must be the first middleware in the chain
   * @returns {Function} Middleware function
   */
  setupRequestContextMiddleware() {
    return (req, res, next) => {
      requestContext.run({ req, res }, () => {
        next();
      });
    };
  }

  /**
   * Sets up HTTP loading middleware
   * @returns {Function} Middleware function
   */
  setupLoadHttpMiddleware() {
    return async (req, res, next) => {
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
        return this.redirect(req, res, status.connectPath);
      }

      if (status.needsInstallOrUpdate) {
        const redirectPath = status.needsUpdate ? status.updatePath : status.installPath;
        if (currentUrl !== redirectPath) {
          return this.redirect(req, res, redirectPath);
        }
      }

      req.__WORKSPACE_NAME__ = RouterUtils.getWorkspaceName(currentUrl);

      if (status.isFullyInstalled && req.__WORKSPACE_NAME__ === "loopar") {
        return this.redirect(req, res, '/desk');
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
      await this.makeController(req, res, next);
      const response = req.__WORKSPACE__;

      if (response?.redirect) {
        return this.redirect(req, res, response.redirect);
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
      this.render(req, res, await this.App.render(req.__WORKSPACE__));
    };
  }

  /**
   * Sets up asset detection middleware
   * @returns {Function} Middleware function
   */
  setupAssetMiddleware() {
    return (req, res, next) => {
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

      res
        .status(404)
        .set('Content-Type', 'text/html')
        .send(errString);
    };
  }

  /**
   * Sets up global error handling middleware
   * @returns {Function} Error middleware function
   */
  setupErrorMiddleware() {
    return async (err, req, res, next) => {
      console.log(["Request Error", err]);
      try {
        loopar.db && (await loopar.db.safeRollback());
      } catch (rollbackErr) {
        console.error("Rollback failed:", rollbackErr);
      }

      if (!res || res.headersSent) return;
      
      const redirect = err?.redirect;
      err = getHttpError(err);

      try {
        if (req.method === 'POST') {
          return this.renderAjax(res, err);
        }

        if (redirect && req._parsedUrl.pathname !== redirect) {
          return this.redirect(req, res, redirect);
        }

        const errControlled = new BaseController({ req, res });
        errControlled.dictUrl = req._parsedUrl;
        const e = await errControlled.getError(err.code, err);

        req.__WORKSPACE__ = merge(
          req.__WORKSPACE__ || {},
          {
            Document: {
              ...e,
              meta: {
                title: err.title
              },
              entryPoint: "error-view",
            }
          }
        );

        return this.render(req, res, await this.App.render(req.__WORKSPACE__, true));
      } catch (renderErr) {
        console.log(["Internal Server Error", renderErr])
        return this.throw(renderErr, res);
      }
    };
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
   * @returns {string|undefined} Error string if no response sent
   */
  throw(err, res) {
    const error = getHttpError(err);
    const code = Number(error?.code) || 500;
    const errString = this.errTemplate(error);

    if (res && !res.headersSent) {
      res
        .status(code)
        .set('Content-Type', 'text/html')
        .send(errString);
      return;
    }

    return errString;
  }
}