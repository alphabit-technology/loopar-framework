
'use strict';

import { BaseDocument, loopar } from 'loopar';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Cloudflare Turnstile — reusable anti-bot layer for any public form.
 * Usage: `(await loopar.getDocument('Turnstile'))?.assertHuman(token, ip)`.
 * Config: env TURNSTILE_SITE_KEY / TURNSTILE_SECRET_KEY win; else the
 * entity's keys while `enabled`. No keys anywhere → every check is a no-op.
 */
export default class Turnstile extends BaseDocument {
  getKeys() {
    const entityActive = !!this.enabled;

    return {
      siteKey: process.env.TURNSTILE_SITE_KEY || (entityActive ? this.site_key : '') || '',
      secretKey: process.env.TURNSTILE_SECRET_KEY || (entityActive ? this.secret_key : '') || ''
    };
  }

  /** True when the check should run (a secret is available). */
  isActive() {
    return !!this.getKeys().secretKey;
  }

  /** Site key safe to expose to browsers ('' when inactive). */
  publicSiteKey() {
    return this.isActive() ? (this.getKeys().siteKey || '') : '';
  }

  /**
   * Verify a widget token against Cloudflare. Returns 'skipped' (inactive),
   * true (verified — or unreachable: fail-open so an outage never kills
   * public forms), or false (token missing/rejected).
   */
  async verifyToken(token, remoteip) {
    if (!this.isActive()) return 'skipped';
    if (!token) return false;

    try {
      const res = await fetch(VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          secret: this.getKeys().secretKey,
          response: token,
          ...(remoteip ? { remoteip } : {})
        })
      });

      const outcome = await res.json();
      if (!outcome.success) {
        console.warn('[turnstile] token rejected:', outcome['error-codes']);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('[turnstile] verify unreachable, failing open:', error.message);
      return true;
    }
  }

  /**
   * Guard for public actions: throws when active and the token is invalid;
   * passes otherwise. True only when positively verified, false when skipped.
   */
  async assertHuman(token, remoteip) {
    const result = await this.verifyToken(token, remoteip);

    if (result === false) {
      loopar.throw('Verification failed. Please refresh the page and try again...');
    }

    return result === true;
  }
}
