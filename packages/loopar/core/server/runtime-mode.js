
import fs from 'fs';
import path from 'pathe';
import { coreEnv } from '../config/core-config.js';

/**
 * Runtime mode is a CORE-level setting now (config/core.json → nodeEnv), not
 * per-tenant: one process serves every tenant, so it runs a single mode —
 * Vite (development) or the prebuilt dist (production).
 */

const TTL_MS = 1000;
let distCache = { value: null, at: 0 };

export function readRuntimeMode() {
  return coreEnv();
}

export function distIsReady() {
  const now = Date.now();
  if (distCache.value !== null && now - distCache.at < TTL_MS) {
    return distCache.value;
  }

  const clientHtml = path.join(process.cwd(), 'dist/client/main.html');
  const serverBundle = path.join(process.cwd(), 'dist/server/entry-server.js');
  const value = fs.existsSync(clientHtml) && fs.existsSync(serverBundle);

  distCache = { value, at: now };
  return value;
}

export function shouldServeProduction() {
  return readRuntimeMode() === 'production' && distIsReady();
}
