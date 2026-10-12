'use strict';

import crypto from 'crypto';

/**
 * Field secrets — reversible encryption for credentials Loopar must send
 * back out (SMTP passwords, API keys, git tokens…).
 *
 *   enc:v1:<iv>:<tag>:<ciphertext>     (base64url parts, AES-256-GCM)
 *
 * The 32-byte key is derived with HKDF from the tenant's `secretKey`
 * (sites/<tenant>/config.json), or from LOOPAR_SECRET_KEY when set — in that
 * case the tenant id is the HKDF salt, so each tenant still gets its own key.
 * Ciphertext from one tenant can't be read by another.
 */

export const SECRET_PREFIX = 'enc:v1:';
const INFO = 'loopar:field-secrets:v1';

export const isEncryptedSecret = (value) =>
  typeof value === 'string' && value.startsWith(SECRET_PREFIX);

/** Values already produced by a one-way hash (argon2, legacy sha1/sha256 hex). */
export const isHashedSecret = (value) =>
  typeof value === 'string' &&
  (value.startsWith('$argon2') || /^[a-f0-9]{40}$/.test(value) || /^[a-f0-9]{64}$/.test(value));

export function deriveSecretKey(material, salt = '') {
  if (!material) throw new Error('[secrets] missing key material');
  return Buffer.from(crypto.hkdfSync('sha256', String(material), String(salt), INFO, 32));
}

const b64 = (buf) => buf.toString('base64url');
const unb64 = (str) => Buffer.from(str, 'base64url');

export function encryptSecret(plain, key) {
  if (plain == null || plain === '') return '';
  if (isEncryptedSecret(plain)) return plain;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return SECRET_PREFIX + [b64(iv), b64(cipher.getAuthTag()), b64(ct)].join(':');
}

/** Throws when the value was encrypted with another key or was tampered with. */
export function decryptSecret(value, key) {
  if (!isEncryptedSecret(value)) return value;
  const [iv, tag, ct] = value.slice(SECRET_PREFIX.length).split(':');
  if (!iv || !tag || ct == null) throw new Error('[secrets] malformed encrypted value');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, unb64(iv));
  decipher.setAuthTag(unb64(tag));
  return Buffer.concat([decipher.update(unb64(ct)), decipher.final()]).toString('utf8');
}
