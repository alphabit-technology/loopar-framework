
import fs from 'fs';
import path from 'pathe';
import { loopar } from '../loopar.js';

const TTL_MS = 1000;

let modeCache = { value: null, at: 0 };
let distCache = { value: null, at: 0 };

export function readRuntimeMode() {
  const now = Date.now();
  if (modeCache.value !== null && now - modeCache.at < TTL_MS) {
    return modeCache.value;
  }

  let value;
  try {
    const envPath = path.join(loopar.tenantPath, '.env');
    const content = fs.readFileSync(envPath, 'utf-8');
    const match = content.match(/^NODE_ENV\s*=\s*(.+)$/m);
    const raw = match?.[1]?.trim().replace(/^["'](.*)["']$/, '$1');
    value = raw || process.env.NODE_ENV || 'development';
  } catch {
    value = process.env.NODE_ENV || 'development';
  }

  modeCache = { value, at: now };
  return value;
}

export function distIsReady() {
  const now = Date.now();
  if (distCache.value !== null && now - distCache.at < TTL_MS) {
    return distCache.value;
  }

  const clientHtml = path.join(loopar.pathRoot, 'dist/client/main.html');
  const serverBundle = path.join(loopar.pathRoot, 'dist/server/entry-server.js');
  const value = fs.existsSync(clientHtml) && fs.existsSync(serverBundle);

  distCache = { value, at: now };
  return value;
}

export function shouldServeProduction() {
  return readRuntimeMode() === 'production' && distIsReady();
}

export function isDevTenant() {
  return process.env.TENANT_ID === 'dev';
}
