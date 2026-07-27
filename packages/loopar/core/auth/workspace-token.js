'use strict';

import crypto from 'crypto';
import { loopar } from '../loopar.js';
import { VALID_WORKSPACES } from '../global/router-utils.js';

/**
 * Signed workspace identity — same spirit as the CSRF double-submit token.
 *
 * On the initial GET the server DOES know the workspace reliably (it's in the
 * URL of a real navigation). We sign that name and ship it to the client in
 * `__META__.wsToken`; the client echoes it back on every RPC via the
 * `X-Workspace-Token` header. Because the signature is an HMAC over the
 * tenant + workspace with the tenant's private secret, the client cannot
 * forge a workspace it never visited, and a token minted for one tenant is
 * useless on another.
 *
 * NOTE: the token proves "this browser DID load workspace X on this tenant".
 * It is context, not authorization — auth/permissions are still enforced per
 * controller action (publicAction* / freeActions / PermissionManager).
 */

/** Workspaces a token may name. `web` is valid but has no URL prefix. */
const SIGNABLE_WORKSPACES = new Set([...VALID_WORKSPACES, 'web']);

function secret() {
  // jwtSecret throws before init() resolves it (e.g. very early boot).
  try {
    return loopar.jwtSecret;
  } catch {
    return null;
  }
}

function hmac(payload, key) {
  return crypto.createHmac('sha256', key).update(payload).digest('hex');
}

function payloadFor(workspace) {
  return `ws:${loopar.tenantId || 'default'}:${workspace}`;
}

/**
 * Signs a workspace name. Returns `null` when the secret isn't available yet
 * (pre-init render) — the client simply won't send a token and the server
 * falls back to URL-based resolution.
 */
export function signWorkspaceToken(workspace) {
  const name = String(workspace || 'web').toLowerCase();
  if (!SIGNABLE_WORKSPACES.has(name)) return null;

  const key = secret();
  if (!key) return null;

  return `${name}.${hmac(payloadFor(name), key)}`;
}

/**
 * Verifies a token from `X-Workspace-Token`.
 * @returns {string|null} the workspace name, or null when missing/invalid.
 */
export function verifyWorkspaceToken(token) {
  if (typeof token !== 'string' || token.length > 128) return null;

  const dot = token.indexOf('.');
  if (dot <= 0) return null;

  const name = token.slice(0, dot).toLowerCase();
  const signature = token.slice(dot + 1);
  if (!SIGNABLE_WORKSPACES.has(name)) return null;

  const key = secret();
  if (!key) return null;

  const expected = hmac(payloadFor(name), key);
  if (signature.length !== expected.length) return null;

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ? name
      : null;
  } catch {
    return null;
  }
}
