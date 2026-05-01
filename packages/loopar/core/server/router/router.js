'use strict';
import { loopar } from '../../loopar.js';
import { fileManage } from "../../file-manage.js";
import multer from "multer";
import BaseController from '../../controller/base-controller.js';
import { RouterUtils } from './router-utils.js';
import { merge } from 'es-toolkit/object';
import { Middleware } from "./middleware.js";
import { requestContext } from './request-context.js';
import {trackVisit} from "./track/track-visit.js"

export default class Router extends Middleware {
  constructor(options) {
    super(options);
    this.uploader = multer({ storage: multer.memoryStorage() }).any();
  }

  /**
   * Renders HTML response
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} response - Response data
   */
  render(req, res, response) {
    if (res.headersSent) return;

    if (response instanceof Error) {
      res
        .status(500)
        .set('Content-Type', 'text/html')
        .send(response.message);
      return;
    }

    if (!response || typeof response !== 'object') {
      res
        .status(500)
        .set('Content-Type', 'text/html')
        .send('Invalid response');
      return;
    }

    res
      .status(response.status || 200)
      .set('Content-Type', response.contentType || 'text/html')
      .send(response.body ?? '');
  }

  /**
   * Renders AJAX/JSON response with a single, stable wire shape.
   *
   * Error responses (status >= 400):  { status, code, title, message }
   * Success responses:                { status, success: true, message?, notify?, ...payload }
   *
   * Anything else passed in (raw Error, string, object) is normalized here so
   * downstream code never has to think about the shape.
   */
  renderAjax(res, response) {
    if (res.headersSent) return;

    if (!response) {
      console.error('Error: Empty response received');
      return;
    }

    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST',
      'Access-Control-Allow-Headers': 'Content-Type'
    };

    if (response instanceof Error) {
      res.status(500).set(headers).json({
        status: 500,
        code: response.code || 'INTERNAL_ERROR',
        title: response.title || 'Internal Server Error',
        message: response.message || 'An unexpected error occurred'
      });
      return;
    }

    if (typeof response === 'string') {
      res.status(200).set(headers).json({ status: 200, success: true, message: response });
      return;
    }

    const status = Number(response.status) || Number(response.code) || 200;
    res.status(status).set(headers).json(response);
  }

  route() {
    this.App = null;
    this.baseUrl = null;

    this.server.use(
      this.setupAssetMiddleware(),
      this.setupNotFoundSourceMiddleware(),
      this.setupLoadHttpMiddleware(),
      this.setupSystemMiddleware(),
      this.setupBuildParamsMiddleware(),
      this.setupRateLimitMiddleware(),
      this.setupWorkspaceMiddleware(),
      this.setupControllerMiddleware(),
      this.setupFinalMiddleware()
    );

    this.server.use(this.setupErrorMiddleware());
  }

  /**
   * Creates and executes controller
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async makeController(req, res, next) {
    const params = req.__params__;

    if (req.tryToServePrivateFile) {
      return await this.handlePrivateFile(req, res);
    }

    RouterUtils.setDefaultParams(params, req.__WORKSPACE_NAME__);

    if (req.__WORKSPACE_NAME__ === "web") {
      const menu = RouterUtils.RouteParsing.findWebAppMenu(params.document, loopar);
      if (!menu) {
        return loopar.throw({
          code: 404,
          message: !loopar.webApp?.name ? "The web app has not yet been set up in System Settings." : "Page not found"
        });
      }
      params.document = menu.page;
    }

    const ref = loopar.getRef(loopar.utils.Capitalize(params.document), false);

    if (!ref) {
      loopar.throw({
        code: 404,
        message: `Document ${params.document} not found.`
      });
    }

    params.document = ref.__NAME__;

    void trackVisit(req, params).catch((error) => {
      console.warn(["Can not updated Analytics", error]);
    });
    
    return await this.executeController(req, res, next, params, ref);
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
    req.__WORKSPACE__.Document = e;
    return this.render(req, res, await this.App.render(req.__WORKSPACE__, true));
  }

  /**
   * Executes controller logic
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Object} params - Request parameters
   * @param {Object} ref - Document reference
   */
  async executeController(req, res, next, params, ref) {
    const makeController = async (query, body) => {
      const parsedQuery = RouterUtils.parseQuery(query);

      const C = await fileManage.importClass(
        loopar.makePath(ref.__ROOT__, `${params.document}Controller.js`)
      );
      
      const Controller = new C({
        ...params,
        ...parsedQuery,
        query: parsedQuery,
        data: RouterUtils.prepareFileData(body, req.files),
        body: RouterUtils.prepareFileData(body, req.files),
        __REQ_FILES__: req.files,
        enabledActions: C.enabledActions,
        freeActions: C.freeActions
      });

      const action = params.action?.length > 0 ? params.action : Controller.defaultAction;
      Controller.action = action;

      const result = await Controller.sendAction(action) || {};

      if (result) {
        if (RouterUtils.isAjaxRequest(req) || (typeof result == "object" && result.redirect)) {
          req.__WORKSPACE__ = result;
        } else {
          req.__WORKSPACE__ = merge(
            req.__WORKSPACE__ || {},
            {
              Document: merge(
                result,
                {
                  meta: {
                    module: ref?.module
                  }
                }
              )
            }
          );
        }
      }
    };

    const contentType = req.headers['content-type'];
    const isMultipart = RouterUtils.isMultipartFormData(contentType);

    if (isMultipart) {
      return new Promise((resolve, reject) => {
        this.uploader(req, res, async err => {
          if (err) {
            reject(err);
            return;
          }

          try {
            requestContext.run({ req, res }, async () => {
              try {
                resolve(await makeController(req.query, req.body));
              } catch (controllerErr) {
                reject(controllerErr);
              }
            });
          } catch (controllerErr) {
            reject(controllerErr);
          }
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
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {string} url - URL to redirect to
   */
  redirect(req, res, url) {
    if (res.headersSent) return;

    const redirectUrl = this.makeUrl(url, req._parsedUrl?.pathname || '/');
    res.redirect(redirectUrl || '/desk');
  }
}