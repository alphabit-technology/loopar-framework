import Cookies from 'js-cookie';

/**
 * persist-state store: persisted, SSR-consistent UI state.
 *
 * All keys of a workspace share a SINGLE JSON cookie (`loopar-vs-<workspace>`)
 * instead of one cookie per widget. That keeps the cookie count constant
 * (avoids the per-domain limit and header bloat) while staying readable by
 * the server during SSR — so the server renders the same tab/section/nav
 * state the client will hydrate, with no visual jump.
 *
 * The cookie is `Path`-scoped to its workspace, so desk state never travels
 * on web requests and vice versa.
 */

const COOKIE_PREFIX = 'loopar-ps-';
const COOKIE_EXPIRES_DAYS = 365;

/**
 * Coarse `Path` scope per workspace. Coarse on purpose: one cookie per area
 * (a handful total), not one per route — per-route scoping would reintroduce
 * unbounded cookie growth.
 */
function workspacePath(workspace) {
  switch (workspace) {
    case 'desk': return '/desk';
    case 'auth': return '/auth';
    case 'loopar': return '/loopar';
    default: return '/';
  }
}

function safeParse(raw) {
  if (!raw || typeof raw !== 'string') return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Create a persist-state store.
 *
 * One instance per render tree: on the client it is created once and lives
 * for the page session; on the server it is created once per request, so
 * there is no cross-request state leak (no module-level global).
 *
 * @param {Object} opts
 * @param {string} opts.workspace - Current workspace name.
 * @param {Object} [opts.serverManager] - Server cookie manager (SSR only);
 * exposes `get(name)`.
 * @returns {{ workspace:string, get:Function, set:Function, subscribe:Function }}
 */
export function createPersistStateStore({ workspace, serverManager } = {}) {
  const ws = workspace || 'desk';
  const cookieName = COOKIE_PREFIX + ws;
  const cookiePath = workspacePath(ws);
  const isServer = typeof window === 'undefined';

  const readCookie = () =>
    isServer ? serverManager?.get?.(cookieName) : Cookies.get(cookieName);

  let data = safeParse(readCookie());
  const listeners = new Set();

  const persist = () => {
    // UI state is only ever written from client-side events; there is
    // nothing to persist during an SSR render.
    if (isServer) return;

    Cookies.set(cookieName, JSON.stringify(data), {
      path: cookiePath,
      expires: COOKIE_EXPIRES_DAYS,
      sameSite: 'lax',
    });
  };

  return {
    workspace: ws,

    get(key) {
      return data[key];
    },

    /** Write `key`, persist the whole cookie, notify subscribers. */
    set(key, value) {
      if (data[key] === value) return;
      data = { ...data, [key]: value };
      persist();
      listeners.forEach((listener) => listener());
    },

    /** Subscribe to any change; returns an unsubscribe function. */
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
