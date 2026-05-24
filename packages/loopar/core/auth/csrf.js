import crypto from 'crypto';

/** Double-submit cookie name (must match client-readable cookie). */
export const CSRF_COOKIE_NAME = 'csrf-token';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(req) {
  const normalize = (v) => (Array.isArray(v) ? v[0] : v);
  const fromHeader = normalize(req.headers['x-csrf-token']);
  const fromCookie = normalize(req.cookies?.[CSRF_COOKIE_NAME]);

  if (!fromHeader || !fromCookie) return false;
  if (typeof fromHeader !== 'string' || typeof fromCookie !== 'string') return false;
  if (fromHeader.length !== fromCookie.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(fromHeader),
      Buffer.from(fromCookie)
    );
  } catch {
    return false;
  }
}