import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import {loopar} from "loopar"

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

export async function generatePasswordResetToken(email) {
  const user = await loopar.db.getDoc('User', { email });

  if (!user) return { ok: true };

  const rawToken = jwt.sign(
    { sub: user.name, purpose: 'password-reset' },
    loopar.jwtSecret,
    { expiresIn: '30m' }
  );

  await loopar.db.updateRow('User', user.name, {
    reset_password_token: hashToken(rawToken),
  });

  return { ok: true, user, rawToken };
}

export async function validatePasswordResetToken(rawToken) {
  console.log(["reset Pasword", rawToken])
  let payload;
  try {
    payload = jwt.verify(rawToken, loopar.jwtSecret);
  } catch (e) {
    const reason = e.name === 'TokenExpiredError' ? 'expired' : 'invalid';
    return { valid: false, reason };
  }

  if (payload.purpose !== 'password-reset') {
    return { valid: false, reason: 'invalid' };
  }

  
  const user = await loopar.db.getDoc('User', { name: payload.sub });

  if (!user || user.reset_password_token !== hashToken(rawToken)) {
    return { valid: false, reason: 'invalid' };
  }

  return { valid: true, user };
}

export async function resetPassword(rawToken, newPassword) {
  const { valid, reason, user } = await validatePasswordResetToken(rawToken);
  if (!valid) throw new Error(reason === 'expired' ? 'Link expired' : 'Invalid Link');

  const hashedPassword = await loopar.hash(newPassword);

  await loopar.db.updateRow('User', user.name, {
    password: hashedPassword,
    reset_password_token: null,
  });

  return { ok: true };
}