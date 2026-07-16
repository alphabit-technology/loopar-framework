'use strict';

/**
 * CaddyManager moved to the framework package so it can be used in "bare
 * mode" (loopar-cli / loopar-tui) without loading any app code:
 *
 *   packages/loopar/bin/tenant/caddy-manager.js
 *
 * This shim keeps the old import path working for anything that still
 * resolves it relative to the tenant-manager entity.
 */

export { default } from 'loopar/bin/tenant/caddy-manager.js';
