
'use strict';

import { BaseDocument, loopar } from 'loopar';
import crypto from 'node:crypto';
import { createChallenge, verifySolution } from 'altcha-lib/v1';

const CHALLENGE_TTL_MS = 10 * 60 * 1000; // challenge validity window
const DEFAULT_MAX_NUMBER = 100000; // PoW difficulty (higher = costlier)

// Replay protection: a solved payload is single-use. In-memory is fine with
// instances:1; move to redis/db if clustering ever lands.
const usedPayloads = new Map(); // sha256(payload) -> expiry epoch ms

// Process-lifetime HMAC key, generated lazily when nothing is configured.
// NOT persisted: `hmac_key` is a password field (its masked value doesn't
// round-trip a save) and writing from a public request proved fragile. A
// restart only invalidates in-flight challenges (10 min TTL) — acceptable.
let processHmacKey = null;

function pruneUsedPayloads() {
  const now = Date.now();
  for (const [key, expiry] of usedPayloads) {
    if (expiry <= now) usedPayloads.delete(key);
  }
}

/**
 * ALTCHA — self-hosted proof-of-work anti-bot (MIT, altcha.org). No external
 * service or per-domain setup: the server issues an HMAC-signed challenge,
 * the browser solves it in a Web Worker, the server verifies. Same consumer
 * API as Turnstile: isActive() / assertHuman(token, ip).
 */
export default class Altcha extends BaseDocument {
  isActive() {
    return !!process.env.ALTCHA_HMAC_KEY || !!this.enabled;
  }

  resolveHmacKey() {
    const configured =
      process.env.ALTCHA_HMAC_KEY ||
      (this.enabled ? this.hmac_key : '') ||
      '';
    if (configured) return configured;

    processHmacKey ||= crypto.randomBytes(32).toString('hex');
    return processHmacKey;
  }

  async createFormChallenge() {
    return await createChallenge({
      hmacKey: this.resolveHmacKey(),
      maxNumber: parseInt(this.max_number) || DEFAULT_MAX_NUMBER,
      expires: new Date(Date.now() + CHALLENGE_TTL_MS)
    });
  }

  /**
   * Verify a solved payload (base64 JSON from the widget's hidden input).
   * Single-use: a payload that verified once is rejected on replay.
   */
  async verifyPayload(payload) {
    if (!payload || typeof payload !== 'string') return false;

    const hmacKey = this.resolveHmacKey();
    if (!hmacKey) return false;

    const fingerprint = crypto.createHash('sha256').update(payload).digest('hex');
    if (usedPayloads.has(fingerprint)) {
      console.warn('[altcha] replayed payload rejected');
      return false;
    }

    const ok = await verifySolution(payload, hmacKey, true);
    if (!ok) return false;

    pruneUsedPayloads();
    usedPayloads.set(fingerprint, Date.now() + CHALLENGE_TTL_MS);
    return true;
  }

  /**
   * Guard for public actions (same contract as Turnstile.assertHuman): throws
   * when active and the token is invalid; no-op when inactive. `_ip` unused.
   */
  async assertHuman(token, _ip) {
    if (!this.isActive()) return false;

    const ok = await this.verifyPayload(token);
    if (!ok) {
      loopar.throw('Verification failed. Please refresh the page and try again.');
    }

    return true;
  }
}
