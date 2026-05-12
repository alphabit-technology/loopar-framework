'use strict';

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

export function isAjaxRequest(req) {
  return req.method === 'POST' || req.__WORKSPACE_NAME__ === 'api';
}

export function isMultipartFormData(contentType) {
  return contentType?.startsWith('multipart/form-data');
}

export function prepareFileData(body, files) {
  return {
    ...body,
    ...(files?.length > 0 ? { __REQ_FILES__: files } : {}),
  };
}


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

export const SystemValidation = {
  getStatus(loopar) {
    const { DBServerInitialized, DBInitialized, __installed__, __wasInstalled__ } = loopar;

    return {
      needsConnect: !DBServerInitialized,
      needsInstallOrUpdate: DBServerInitialized && (!DBInitialized || !__installed__),
      needsUpdate: !!DBInitialized && !!__wasInstalled__,
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
