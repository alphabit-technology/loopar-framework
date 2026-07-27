#!/usr/bin/env node

/**
 * Core boot — the "generator". Starts only the server (HTTP + Vite + realtime
 * + per-request tenant resolution); no tenant is loaded until one is turned On.
 * Every tenant domain routes here via Caddy's catch-all.
 */
import { coreEnvVars } from "../core/config/core-config.js";

// Fill process.env from config/core.json when not set (e.g. run directly, not
// via PM2). Runtime reads process.env.*.
for (const [k, v] of Object.entries(coreEnvVars())) {
  if (process.env[k] === undefined) process.env[k] = String(v);
}

const { startCore } = await import("../index.js");
await startCore();
