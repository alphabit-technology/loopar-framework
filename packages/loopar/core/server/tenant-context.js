import session from 'express-session';
import { FileSessionStore } from './lib/FileSessionStorage.js';
import path from 'path';
import crypto from 'node:crypto';
import { loopar } from '../loopar.js';

/**
 * Tenant-scoped session middleware.
 *
 * Built lazily and cached PER TENANT (Map keyed by tenant id). Each entry is
 * an express-session middleware whose store, cookie name and secret are the
 * tenant's own.
 *
 */
const middlewareByTenant = new Map();

function buildMiddleware(tenantId) {
  if (!tenantId) return null;

  const sessionsPath = path.join(loopar.pathRoot, 'sites', tenantId, 'sessions');

  const sessionStore = new FileSessionStore({
    path: sessionsPath,
    ttl: 86400,
    reapInterval: 3600,
  });

  const sessionSecret = crypto.createHash('sha256').update(`${loopar.jwtSecret}:session`).digest('hex');

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
  const tenantId = loopar.requestTenantId;

  let mw = middlewareByTenant.get(tenantId);
  if (!mw) {
    mw = buildMiddleware(tenantId);
    if (!mw) {
      return res.status(400).json({ error: 'Tenant not identified' });
    }
    middlewareByTenant.set(tenantId, mw);
  }

  return mw(req, res, next);
}
