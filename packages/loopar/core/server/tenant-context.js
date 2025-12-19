import session from 'express-session';
import {FileSessionStore} from './lib/FileSessionStorage.js';
import path from 'path';
import {loopar} from '../loopar.js';

export default function tenantContextMiddleware(req, res, next) {
  const tenantId = loopar.tenantId;
  
  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant not identified' });
  }
  
  const tenantPath = path.join(loopar.pathRoot, 'sites', tenantId);
  const sessionsPath = path.join(tenantPath, 'sessions');
  
  const sessionStore = new FileSessionStore({
    path: sessionsPath,
    ttl: 86400,
    reapInterval: 3600
  });
  
  const sessionMiddleware = session({
    name: `loopar_${tenantId}`,
    secret: process.env.SESSION_SECRET || `loopar-secret-${tenantId}`,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: 'lax'
    }
  });
  
  sessionMiddleware(req, res, next);
}