import crypto from 'crypto';

/** Double-submit cookie name (must match client-readable cookie). */
export const CSRF_COOKIE_NAME = 'csrf-token';

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function validateCsrfToken(req) {
  const fromHeader = req.headers['x-csrf-token'];
  const fromCookie = req.cookies?.[CSRF_COOKIE_NAME];

  if (!fromHeader || !fromCookie) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(fromHeader),
      Buffer.from(fromCookie)
    );
  } catch {
    return false;
  }
}