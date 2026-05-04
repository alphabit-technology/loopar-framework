import { loopar } from '../../loopar.js';
import { RouterUtils } from './router-utils.js';
import WorkspaceController from '../../controller/workspace-controller.js';
import { getHttpError } from '../../global/http-errors.js';
import BaseController from '../../controller/base-controller.js';
import { merge } from 'es-toolkit/object';
import { requestContext } from './request-context.js';
import rateLimit from 'express-rate-limit';


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

      // /api/System/* is the AJAX counterpart of the bootstrap pages under
      // /loopar/system/* — the form submits its payload there. Never redirect
      // those, otherwise fetch follows the 302 and the browser navigates,
      // killing the POST and producing a stray GET on the original page.
      const isApiToSystem = currentUrl.startsWith('/api/System/');

      if (status.needsConnect && currentUrl !== status.connectPath && !isApiToSystem) {
        return this.redirect(req, res, status.connectPath);
      }

      if (status.needsInstallOrUpdate) {
        const redirectPath = status.needsUpdate ? status.updatePath : status.installPath;
        if (currentUrl !== redirectPath && !isApiToSystem) {
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
      // No HTML workspace UI for AJAX channels (POST or /api/* of any verb).
      if (RouterUtils.isAjaxRequest(req)) return next();

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

      // AJAX channel (POST or /api/*) NEVER emits a 302 — would make fetch
      // follow it and the client end up navigating to the wrong place. The
      // redirect URL travels inside the JSON; the client decides.
      if (RouterUtils.isAjaxRequest(req)) {
        return this.renderAjax(res, response);
      }

      if (response?.redirect) {
        return this.redirect(req, res, response.redirect);
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
        if (RouterUtils.isAjaxRequest(req)) {
          // Surface redirect (if any) inside the JSON so the client can
          // navigate after handling the error UX.
          return this.renderAjax(res, redirect ? { ...err, redirect } : err);
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

  setupRateLimitMiddleware() {
    const minutes = 15;
    const loginLimiter = rateLimit({
      windowMs: minutes * 60 * 1000,
      max: 15,
      standardHeaders: true,
      legacyHeaders: false,
      handler: (req, res) => {
        res.status(429).json({
          status: 429,
          code: 'RATE_LIMITED',
          title: 'Too Many Requests',
          message: `Too many login attempts, try again in ${minutes} minutes`
        });
      },
    });
  
    return (req, res, next) => {
      const isLoginPost = req.method === 'POST' 
        && req.__WORKSPACE_NAME__ === 'auth'
        && req._parsedUrl.pathname.toLowerCase().includes('login');
  
      if (!isLoginPost) return next();
      return loginLimiter(req, res, next);
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