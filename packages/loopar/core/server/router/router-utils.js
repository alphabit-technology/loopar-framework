'use strict';

// ========================================
// SHARED CONSTANTS
// ========================================
export const ASSET_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico', // Images
  'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac', // Multimedia
  'woff', 'woff2', 'ttf', 'eot', 'otf', // Fonts
  'js', 'mjs', 'jsx', 'css', 'html', 'htm', 'xhtml', // Web files
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', // Documents
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'gzip', 'br', // Compressed files
  'json', 'xml', 'txt', 'yaml' // Data files
]);

export const VALID_WORKSPACES = new Set(['desk', 'auth', 'loopar']);

export const SYSTEM_PATHS = {
  CONNECT: '/loopar/system/connect',
  UPDATE: '/loopar/system/update',
  INSTALL: '/loopar/system/install'
};

// ========================================
// PURE UTILITY FUNCTIONS
// ========================================

/**
 * Generates HTML error template
 * @param {Object} err - Error object containing code, title, and description
 * @returns {string} HTML error template
 */
export function generateErrorTemplate(err) {
  return `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column; background-color: #0b0b0f; color: #95b3d6;">
      <h1 style="font-size: 100px; margin: 0;">${err.code}</h1>
      <h3 style="font-size: 30px; margin: 0;">${err.title}</h3>
      <span style="font-size: 20px; margin: 0;">${err.description}</span>
      <hr style="width: 50%; margin: 20px 0;"/>
      <span style="font-size: 20px; margin: 0;">Loopar</span>
    </div>
  `;
}

/**
 * Checks if a URL corresponds to a static asset
 * @param {string} pathname - The URL pathname to check
 * @returns {boolean} True if the URL is a static asset
 */
export function isAssetUrl(pathname) {
  // Fast path: exclude API routes
  if (pathname.includes("/api/") || pathname.includes("/admin/")) return false;

  // Fast path: find last dot
  const lastDotIndex = pathname.lastIndexOf('.');
  if (lastDotIndex === -1) return false;
  
  const extension = pathname.substring(lastDotIndex + 1).toLowerCase();
  return ASSET_EXTENSIONS.has(extension);
}

/**
 * Gets the workspace name from a URL pathname
 * @param {string} pathname - The URL pathname
 * @returns {string} The workspace name ('desk', 'auth', 'loopar', or 'web')
 */
export function getWorkspaceName(pathname) {
  const context = pathname.split("/")[1];
  return VALID_WORKSPACES.has(context.toLowerCase()) ? context.toLowerCase() : 'web'
}

/**
 * Checks if content type is multipart form data
 * @param {string} contentType - The content type header
 * @returns {boolean} True if multipart form data
 */
export function isMultipartFormData(contentType) {
  return contentType?.startsWith('multipart/form-data');
}

/**
 * Prepares file data for controller
 * @param {Object} body - Request body
 * @param {Array} files - Uploaded files
 * @returns {Object} Data object with files if present
 */
export function prepareFileData(body, files) {
  return { 
    ...body, 
    ...(files?.length > 0 ? { __REQ_FILES__: files } : {}) 
  };
}

/**
 * Sets default parameters for routing
 * @param {Object} params - The parameters object to modify
 * @param {string} workspaceName - The workspace name
 */
export function setDefaultParams(params, workspaceName) {
  if (!params.document && !params.action && workspaceName === 'desk') {
    params.document = "Desk";
    params.action = "view";
  }

  if (!params.action || !params.document) {
    params.name = params.document;
    params.document = 'Module';
    params.action ??= 'view';
  }
}

/**
 * Builds URL from href and current URL
 * @param {string} href - The href to process
 * @param {string} currentURL - The current URL
 * @returns {string} The built URL
 */
export function buildUrl(href, currentURL) {
  if (href.startsWith("http") || href.startsWith("/")) return href;

  const urlStructure = ["workspace", "document", "action"];
  const urlArray = currentURL.split("/");

  // Create URL object using reduce (functional approach)
  const urlObject = urlStructure.reduce((obj, key, index) => {
    obj[key] = urlArray[index + 1];
    return obj;
  }, {});

  const [baseUrl, queryString] = href.split("?");
  const baseUrlSegments = baseUrl.split("/").reverse();

  // Update URL object with new segments
  for (let i = 0; i < urlStructure.length; i++) {
    const key = urlStructure[urlStructure.length - 1 - i];
    urlObject[key] = baseUrlSegments[i] || urlObject[key];
  }

  const pathParts = Object.values(urlObject).filter(e => e && e !== "");
  return `/${pathParts.join("/")}${queryString ? "?" + queryString : ""}`;
}

// ========================================
// GROUPED OPERATIONS
// ========================================

/**
 * Router parsing utilities - grouped for related operations
 */
export const RouteParsing = {
  /**
   * Parses route parameters from URL pathname
   * @param {string} pathname - The URL pathname
   * @param {string} workspaceName - The workspace name
   * @param {Object} loopar - Loopar instance for utilities
   * @returns {Object} Parsed route structure with host, document, and action
   */
  parseParams(pathname, workspaceName, loopar) {
    const routeStructure = { host: null, document: null, action: null };
    
    // Adjust pathname based on workspace
    const adjustedPathname = ["web", "auth"].includes(workspaceName) 
      ? pathname 
      : pathname.split("/").slice(1).join("/");

    const segments = adjustedPathname.split("/");
    const structureKeys = Object.keys(routeStructure);
    
    for (let i = 0; i < segments.length && i < structureKeys.length; i++) {
      const seg = segments[i];
      const key = structureKeys[i];
      if (seg && seg.length > 0) {
        routeStructure[key] = key === 'document' 
          ? decodeURIComponent(seg)
          : decodeURIComponent(seg);
      }
    }

    return routeStructure;
  },

  /**
   * Finds web app menu item by document name
   * @param {string} document - The document name to search for
   * @param {Object} loopar - Loopar instance
   * @returns {Object|undefined} The menu item if found
   */
  findWebAppMenu(document, loopar) {
    const webApp = loopar.webApp || { menu_items: [] };
    return webApp.menu_items?.find(item => loopar.utils.toEntityKey(item.link) === loopar.utils.toEntityKey(document));
  }
};

/**
 * System validation utilities
 */
export const SystemValidation = {
  /**
   * Validates database and installation status
   * @param {Object} loopar - Loopar instance
   * @returns {Object} Status object with flags and redirect paths
   */
  getStatus(loopar) {
    const { DBServerInitialized, DBInitialized, __installed__ } = loopar;
    
    return {
      needsConnect: !DBServerInitialized,
      needsInstallOrUpdate: DBServerInitialized && (!DBInitialized || !__installed__),
      needsUpdate: loopar.db.database,
      isFullyInstalled: DBServerInitialized && DBInitialized && __installed__,
      connectPath: SYSTEM_PATHS.CONNECT,
      updatePath: SYSTEM_PATHS.UPDATE,
      installPath: SYSTEM_PATHS.INSTALL
    };
  },

  /**
   * Gets appropriate redirect path based on system status
   * @param {Object} loopar - Loopar instance
   * @returns {string|null} Redirect path or null
   */
  getRedirectPath(loopar) {
    const status = this.getStatus(loopar);
    
    if (status.needsConnect) return status.connectPath;
    if (status.needsInstallOrUpdate) {
      return status.needsUpdate ? status.updatePath : status.installPath;
    }
    
    return null;
  }
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
  
  RouteParsing,
  SystemValidation
};