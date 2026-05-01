'use strict';

/**
 * Server-side router utilities.
 *
 * The pure / isomorphic pieces (constants, URL parsing, workspace
 * resolution, error template, etc.) live in `core/global/router-utils.js`
 * and are re-exported here so existing code that imports from this file
 * keeps working unchanged. Only members that need a request object,
 * multer, or the server-side `loopar` singleton live below.
 */

import {
  ASSET_EXTENSIONS,
  VALID_WORKSPACES,
  SYSTEM_PATHS,
  generateErrorTemplate,
  isAssetUrl,
  getWorkspaceName,
  setDefaultParams,
  buildUrl,
  RouteParsing,
} from '../../global/router-utils.js';

// Re-export everything from global so callers don't have to know which
// file to reach for.
export {
  ASSET_EXTENSIONS,
  VALID_WORKSPACES,
  SYSTEM_PATHS,
  generateErrorTemplate,
  isAssetUrl,
  getWorkspaceName,
  setDefaultParams,
  buildUrl,
  RouteParsing,
};

// ========================================
// SERVER-ONLY HELPERS
// ========================================

/**
 * Determines whether a request expects a JSON/AJAX response (vs. an HTML page).
 *
 * Two cases qualify:
 *   1. POST requests — historically the framework used POST as the AJAX channel.
 *   2. Any request under the `api` workspace, regardless of HTTP verb. The
 *      `api` namespace exists purely as a controller transport (no UI), so a
 *      GET/DELETE/PUT under /api/... must never fall through to the workspace
 *      renderer.
 *
 * @param {Object} req - Express request object
 * @returns {boolean}
 */
export function isAjaxRequest(req) {
  return req.method === 'POST' || req.__WORKSPACE_NAME__ === 'api';
}

/**
 * Checks if a content-type header indicates a multipart form upload.
 */
export function isMultipartFormData(contentType) {
  return contentType?.startsWith('multipart/form-data');
}

/**
 * Combines parsed body fields with multer-extracted files into the
 * shape that controllers consume as `this.data` / `this.body`.
 */
export function prepareFileData(body, files) {
  return {
    ...body,
    ...(files?.length > 0 ? { __REQ_FILES__: files } : {}),
  };
}

/**
 * Coerces typical query-string strings ("true", "42", "null") into the
 * expected JS primitives. Anything else is returned unchanged.
 */
function parseQueryValue(value) {
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (value === 'null') return null;
  if (value === 'undefined') return undefined;
  if (value !== '' && !isNaN(Number(value))) return Number(value);
  return value;
}

export function parseQuery(query = {}) {
  return Object.fromEntries(
    Object.entries(query).map(([k, v]) => [k, parseQueryValue(v)])
  );
}

/**
 * Reads the live install/connect status from the loopar singleton and
 * exposes it together with the canonical bootstrap paths. Server-only:
 * relies on the side-effecting `loopar` instance.
 */
export const SystemValidation = {
  getStatus(loopar) {
    const { DBServerInitialized, DBInitialized, __installed__ } = loopar;

    return {
      needsConnect: !DBServerInitialized,
      needsInstallOrUpdate: DBServerInitialized && (!DBInitialized || !__installed__),
      needsUpdate: loopar.db.database,
      isFullyInstalled: DBServerInitialized && DBInitialized && __installed__,
      connectPath: SYSTEM_PATHS.CONNECT,
      updatePath: SYSTEM_PATHS.UPDATE,
      installPath: SYSTEM_PATHS.INSTALL,
    };
  },

  getRedirectPath(loopar) {
    const status = this.getStatus(loopar);

    if (status.needsConnect) return status.connectPath;
    if (status.needsInstallOrUpdate) {
      return status.needsUpdate ? status.updatePath : status.installPath;
    }

    return null;
  },
};

// ========================================
// AGGREGATE
// ========================================

/**
 * Server-side aggregate. Same shape callers had before — pure members
 * come from global, server-only members are added here.
 */
export const RouterUtils = {
  ASSET_EXTENSIONS,
  VALID_WORKSPACES,
  SYSTEM_PATHS,

  generateErrorTemplate,
  isAssetUrl,
  getWorkspaceName,
  isMultipartFormData,
  prepareFileData,
  setDefaultParams,
  buildUrl,
  isAjaxRequest,

  RouteParsing,
  SystemValidation,
  parseQuery,
};
