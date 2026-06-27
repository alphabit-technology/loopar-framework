'use strict';

/**
 * Isomorphic routing utilities — shared by client and server.
 *
 * Anything that depends on `req`/`res`, multer, or the loopar singleton
 * lives in `core/server/router/router-utils.js` instead. That file
 * re-exports everything from here and adds the server-only pieces, so
 * any code that already imports `RouterUtils` from there keeps working.
 */

// ========================================
// SHARED CONSTANTS
// ========================================

export const ASSET_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'ico',           // Images
  'mp4', 'webm', 'ogg', 'mp3', 'wav', 'flac', 'aac',           // Multimedia
  'woff', 'woff2', 'ttf', 'eot', 'otf',                        // Fonts
  'js', 'mjs', 'jsx', 'css', 'html', 'htm', 'xhtml',           // Web files
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'gzip', 'br',        // Compressed
  'json', 'xml', 'txt', 'yaml',                                // Data
]);

export const VALID_WORKSPACES = ['desk', 'auth', 'loopar', 'api', 'portal'];

/**
 * Per-workspace capabilities — the single source of truth for auth/CSRF/audience
 * behavior, so the rest of the codebase stops branching on hardcoded workspace
 * names (`if (workspace === 'desk')`). Adding a new authenticated surface (e.g.
 * a `portal`) becomes a matter of adding an entry here.
 *
 *  - public:        no auth gate at all (every action allowed; see #award).
 *  - requiresAuth:  must be logged in; unauthenticated → redirect to login.
 *  - enforceCsrf:   POST/mutations validate the CSRF double-submit token.
 *  - blockWebUsers: `user_type === "Web"` accounts are not allowed in.
 *  - isAuth:        the auth surface itself (login/register/recovery pages).
 */
export const WORKSPACE_CAPABILITIES = {
  web:    { public: true,  requiresAuth: false, enforceCsrf: false, blockWebUsers: false, isAuth: false },
  loopar: { public: true,  requiresAuth: false, enforceCsrf: false, blockWebUsers: false, isAuth: false },
  auth:   { public: false, requiresAuth: false, enforceCsrf: false, blockWebUsers: false, isAuth: true  },
  desk:   { public: false, requiresAuth: true,  enforceCsrf: true,  blockWebUsers: true,  isAuth: false },
  api:    { public: false, requiresAuth: true,  enforceCsrf: true,  blockWebUsers: false, isAuth: false },
  // End-user authenticated app ("desk for any logged-in user"). Same auth/CSRF
  // as desk, but does NOT block Web users — its audience is everyone logged in,
  // with visibility governed by permissions (Profile as the baseline).
  portal: { public: false, requiresAuth: true,  enforceCsrf: true,  blockWebUsers: false, isAuth: false },
};

/** Capabilities for a workspace name. Unknown names fall back to `web` (matches getWorkspaceName). */
export function workspaceCapabilities(name) {
  return WORKSPACE_CAPABILITIES[name] || WORKSPACE_CAPABILITIES.web;
}

/** True when the workspace requires a logged-in user. */
export function workspaceRequiresAuth(name) {
  return !!workspaceCapabilities(name).requiresAuth;
}

export const SYSTEM_PATHS = {
  CONNECT: '/loopar/system/connect',
  UPDATE: '/loopar/system/update',
  INSTALL: '/loopar/system/install',
};

// ========================================
// PURE FUNCTIONS
// ========================================

/**
 * Generates a minimal HTML error template. Used by the server when the
 * page renderer is unavailable, but lives here because it has no side
 * effects and may also be useful in client-only error states.
 */
export function generateErrorTemplate(err) {
  return `
    <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column; background-color: #0b0b0f; color: #95b3d6;">
      <h1 style="font-size: 100px; margin: 0;">${err.code}</h1>
      <h3 style="font-size: 30px; margin: 0;">${err.title}</h3>
      <span style="font-size: 20px; margin: 0;">${err.message}</span>
      <hr style="width: 50%; margin: 20px 0;"/>
      <span style="font-size: 20px; margin: 0;">Loopar</span>
    </div>
  `;
}

/**
 * Returns true when the URL points to a static asset (image, font, css,
 * etc.) that should bypass the controller pipeline. Routes under /api/
 * and /admin/ are explicitly excluded so dynamic endpoints whose URL
 * happens to end in a known extension still get routed.
 */
export function isAssetUrl(pathname) {
  if (pathname.includes('/api/') || pathname.includes('/admin/')) return false;

  const lastDotIndex = pathname.lastIndexOf('.');
  if (lastDotIndex === -1) return false;

  const extension = pathname.substring(lastDotIndex + 1).toLowerCase();
  return ASSET_EXTENSIONS.has(extension);
}

/**
 * Resolves the workspace name from a URL pathname. Falls back to "web"
 * when the first segment isn't one of the known workspaces (or when the
 * URL is empty).
 */
export function getWorkspaceName(pathname) {
  const context = pathname.split('/')[1] || 'web';
  return VALID_WORKSPACES.includes(context.toLowerCase())
    ? context.toLowerCase()
    : 'web';
}

/**
 * Mutates `params` in place with workspace-aware defaults. When the caller
 * provides only one segment (e.g. `/desk/auth`) the original document name
 * is preserved as `params.name` so subsequent middlewares can disambiguate.
 */
export function setDefaultParams(params, workspaceName) {
  // Portal routes desk-like (Entity/action) but with its own defaults and no
  // "single segment => Module name" convention. Bare /portal lands on the
  // user's Profile (the baseline everyone can reach); a lone Entity defaults
  // to `view`.
  if (workspaceName === 'portal') {
    if (!params.document) {
      params.document = 'Profile';
      params.action = 'update';
    }
    params.action ??= 'view';
    return params;
  }

  if (!params.document && !params.action && workspaceName === 'desk') {
    params.document = 'Desk';
    params.action = 'view';
  }

  const defaultDocument = {
    desk: 'Module',
    auth: 'Auth',
    web: 'Home',
  };

  const defaultAction = {
    desk: 'view',
    auth: 'login',
    web: 'view',
  };

  if (!params.action || !params.document) {
    params.name = params.document;
    params.document = defaultDocument[workspaceName];
    params.action ??= defaultAction[workspaceName];
  }

  return params;
}

/**
 * Resolves a relative `href` (e.g. "view", "edit?name=Joe") against the
 * current URL by aligning the trailing segments with the conventional
 * `workspace / document / action` structure. Absolute (`/foo`) and
 * external (`http(s)://...`) URLs are returned unchanged.
 *
 * Strips the query string from `currentURL` before parsing so that a
 * trailing `?page=2` doesn't corrupt the segment alignment.
 */
export function buildUrl(href, currentURL) {
  if (!href || href.startsWith('http') || href.startsWith('/')) return href;

  const [cleanCurrentURL] = (currentURL ?? '').split('?');
  const urlArray = cleanCurrentURL.split('/');

  const urlStructure = ['workspace', 'document', 'action'];
  const urlObject = urlStructure.reduce((obj, key, index) => {
    obj[key] = urlArray[index + 1];
    return obj;
  }, {});

  const [baseUrl, queryString] = href.split('?');
  const baseUrlSegments = baseUrl.split('/').reverse();

  for (let i = 0; i < urlStructure.length; i++) {
    const key = urlStructure[urlStructure.length - 1 - i];
    urlObject[key] = baseUrlSegments[i] || urlObject[key];
  }

  const pathParts = Object.values(urlObject).filter((e) => e && e !== '');
  return `/${pathParts.join('/')}${queryString ? '?' + queryString : ''}`;
}

// ========================================
// GROUPED OPERATIONS
// ========================================

export const RouteParsing = {
  /**
   * Splits a pathname into the canonical `{ host, document, action }`
   * shape. The first segment is treated as the workspace prefix and
   * dropped, except for `web` and `auth` where the convention is to
   * keep all segments.
   */
  parseParams(pathname, workspaceName) {
    const cleanPathname = (pathname ?? '').split('?')[0];
    const routeStructure = { host: null, document: null, action: null };

    const adjustedPathname = ['web', 'auth'].includes(workspaceName)
      ? cleanPathname
      : cleanPathname.split('/').slice(1).join('/');

    const segments = adjustedPathname.split('/');
    const keys = Object.keys(routeStructure);

    for (let i = 0; i < segments.length && i < keys.length; i++) {
      const seg = segments[i];
      if (seg && seg.length > 0) {
        routeStructure[keys[i]] = decodeURIComponent(seg);
      }
    }

    return routeStructure;
  },

  /**
   * Looks up a web-app menu item by its (case/whitespace-insensitive)
   * document key. Takes the loopar instance explicitly so the function
   * stays pure with respect to module imports.
   */
  findWebAppMenu(document, loopar) {
    const webApp = loopar.webApp || { menu_items: [] };
    return webApp.menu_items?.find(
      (item) => loopar.utils.toEntityKey(item.link) === loopar.utils.toEntityKey(document)
    );
  },
};

/**
 * Aggregate object — kept for callers that prefer `RouterUtils.X` access.
 * The server-side `core/server/router/router-utils.js` extends this with
 * its server-only members.
 */
export const RouterUtils = {
  ASSET_EXTENSIONS,
  VALID_WORKSPACES,
  WORKSPACE_CAPABILITIES,
  SYSTEM_PATHS,

  generateErrorTemplate,
  isAssetUrl,
  getWorkspaceName,
  workspaceCapabilities,
  workspaceRequiresAuth,
  setDefaultParams,
  buildUrl,

  RouteParsing,
};
