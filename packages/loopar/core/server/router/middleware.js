import fs from 'fs';
import path from 'pathe';
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

      // Any request that will route to the System controller during the
      // install/connect/update bootstrap must be let through. Two shapes
      // reach this middleware:
      //   - Browser-typed:   /loopar/system/connect (lowercase)
      //   - RPC-generated:   /loopar/System/connect  (PascalCase, from
      //     loopar.rpc.post which builds the URL with the Document name)
      //   - Third-party API: /api/System/connect
      // Case-insensitive comparison covers all three without redirecting.
      const currentUrlLower = currentUrl.toLowerCase();
      const isSystemBootstrap =
        currentUrl.startsWith('/api/System/') ||
        currentUrlLower.startsWith('/loopar/system/');

      const matchesBootstrapPath = (target) =>
        currentUrlLower === target.toLowerCase();

      if (status.needsConnect
          && !matchesBootstrapPath(status.connectPath)
          && !isSystemBootstrap) {
        return this.redirect(req, res, status.connectPath);
      }

      if (status.needsInstallOrUpdate) {
        const redirectPath = status.needsUpdate ? status.updatePath : status.installPath;
        if (!matchesBootstrapPath(redirectPath) && !isSystemBootstrap) {
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

      // Per-request, NOT `this.App`: the Middleware/Router instance is shared
      // by every request in the process, and there are awaits between here
      // and the final render. Storing the controller on `this` let two
      // concurrent HTML requests swap each other's App (render A with B's
      // workspace). `req` is the only safe home for per-request state.
      req.__APP__ = Controller;
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
      // redirect URL travels inside the JSON.
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
      this.render(req, res, await req.__APP__.render(req.__WORKSPACE__));
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
   * Sets up not found source middleware.
   *
   * Reaches here only when `express.static` (mounted earlier in
   * `server.js#exposePublicDirectories`) didn't find the asset
   * binary on disk. Before giving up with 404, we look for the
   * asset's mirror sidecar (`{name}.meta.json`) in the same roots —
   * a remote-driver asset (Cloudinary, S3, …) has only the mirror on
   * disk. If found, we 302 to the driver's delivery URL pulled from
   * the mirror.
   *
   * Pure filesystem — no DB. Read-side counterpart to the mirror
   * writer on the save path.
   *
   * @returns {Function} Middleware function
   */
  setupNotFoundSourceMiddleware() {
    return async (req, res, next) => {
      if (!req.isAssetUrl) return next();

      try {
        const target = await this.#resolveRemoteAsset(req._parsedUrl.pathname);
        if (target) {
          return res.redirect(302, target);
        }
      } catch (err) {
        console.warn('[asset middleware] remote lookup failed:', err?.message || err);
      }

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
   * Map a `/assets/{visibility}/...` path back to its real delivery
   * URL when the binary lives outside the local filesystem.
   *
   * Resolution is filesystem-only: the asset's mirror file
   * (`{name}.meta.json`) lives in the same roots `express.static`
   * searches. Zero DB hits on the read path.
   *
   * Scope is intentionally narrow: only URLs under `/assets/public/`
   * and `/assets/private/` (with an optional `/thumbnails/` segment)
   * are resolved. Any other 404 stays a 404.
   */
  async #resolveRemoteAsset(pathname) {
    const m = pathname.match(/^\/assets\/(public|private)\/(thumbnails\/)?(.+)$/);
    if (!m) return null;
    const visibility = m[1];
    const isThumb = !!m[2];
    const filename = decodeURIComponent(m[3]);
    if (!filename || filename.includes('/')) return null;

    return await this.#resolveFromMirror(filename, visibility, isThumb);
  }

  /**
   * Find a `{filename}.meta.json` in any of the asset roots and pull
   * the delivery URL out of it. The mirror is the cheap path — a
   * filesystem stat + small JSON parse.
   * @param {string} filename - The filename to resolve
   * @param {string} visibility - The visibility of the asset
   * @param {boolean} isThumb - Whether the asset is a thumbnail
   * @returns {Promise<string|null>} The delivery URL or null if not found
   */
  async #resolveFromMirror(filename, visibility, isThumb) {
    const roots = loopar.getAssetRoots ? loopar.getAssetRoots(visibility) : [];
    for (const root of roots) {
      const mirrorPath = path.join(root, `${filename}.meta.json`);
      let raw;
      try {
        raw = await fs.promises.readFile(mirrorPath, 'utf8');
      } catch (err) {
        if (err?.code !== 'ENOENT') {
          console.warn('[asset middleware] mirror read failed:', mirrorPath, err?.message);
        }
        continue;
      }
      let meta;
      try { meta = JSON.parse(raw); } catch { continue; }
      if (!meta?.src) continue;

      if (isThumb && meta.storage_driver === 'local') {
        return meta.src;
      }
      return isThumb ? (meta.previewSrc || meta.src) : meta.src;
    }
    return null;
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

        // The error can fire before the workspace middleware ran (asset 404s,
        // body-parser failures…), in which case there is no per-request App
        // to render with — fall back to the bare HTML error template.
        if (!req.__APP__) return this.throw(err, res);

        return this.render(req, res, await req.__APP__.render(req.__WORKSPACE__, true));
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