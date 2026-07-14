import session from 'express-session';
import { FileSessionStore } from './lib/FileSessionStorage.js';
import path from 'path';
import crypto from 'node:crypto';
import { loopar } from '../loopar.js';

/**
 * Tenant-scoped session middleware.
 *
 * The session store and the express-session middleware are constructed ONCE
 * per process — lazily, the first time a request arrives, so we can be sure
 * `loopar.tenantId` is populated by then. Subsequent requests reuse the same
 * middleware instance.
 *
 * Why lazy + module-level cache:
 *   - A single tenant process always serves exactly one tenant (TENANT_ID is
 *     baked in at PM2 start), so the store config is stable for the process
 *     lifetime. No need to keep a Map keyed by tenant.
 *   - FileSessionStore registers a `setInterval` for the reaper in its
 *     constructor. Instantiating it per request leaks one timer per request
 *     forever — the previous version of this file did that, which made the
 *     process accumulate timers until it eventually died under load.
 *   - Behavior observable to the client (cookie name, secret, TTL, samesite)
 *     is unchanged. Only the timing of construction moves.
 */
let cachedMiddleware = null;

function buildMiddleware() {
  const tenantId = loopar.tenantId;
  if (!tenantId) return null;

  const sessionsPath = path.join(loopar.pathRoot, 'sites', tenantId, 'sessions');

  const sessionStore = new FileSessionStore({
    path: sessionsPath,
    ttl: 86400,
    reapInterval: 3600,
  });

  // SECURITY: the old fallback was `loopar-secret-${tenantId}` — derivable
  // from the (public) tenant name, so session cookies could be forged.
  // Now: explicit SESSION_SECRET from the tenant .env wins; otherwise derive
  // a session-scoped key from the tenant's random JWT_SECRET (domain-
  // separated so the same key isn't reused across JWT HMAC and cookie
  // signing).
  const sessionSecret = process.env.SESSION_SECRET ||
    crypto.createHash('sha256').update(`${loopar.jwtSecret}:session`).digest('hex');

  return session({
    name: `loopar_${tenantId}`,
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      // 'auto' = Secure only when the request is actually HTTPS (req.secure,
      // resolved from Caddy's X-Forwarded-Proto via `trust proxy`). Keeps
      // Secure on the domain/HTTPS path; allows login over plain HTTP by IP.
      secure: 'auto',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax',
    },
  });
}

export default function tenantContextMiddleware(req, res, next) {
  if (!cachedMiddleware) {
    cachedMiddleware = buildMiddleware();
    if (!cachedMiddleware) {
      return res.status(400).json({ error: 'Tenant not identified' });
    }
  }

  return cachedMiddleware(req, res, next);
}
