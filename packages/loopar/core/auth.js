import jwt from 'jsonwebtoken';
import { loopar } from './loopar.js';

const getJWTSecret = () => loopar.jwtSecret;
const REFRESH_THRESHOLD = 1800;

export default class Auth {
  constructor(tenantId, getUser, disabledUser) {
    this.tenantId = tenantId;
    this.tokenName = `loopar_token_${tenantId}`;
    this.loggedCookieName = `logged_${tenantId}`;
    this.getUser = getUser;
    this.disabledUser = disabledUser;
  }

  authUser() {
    try {
      const token = loopar.cookie.get(this.tokenName);
      if (!token) return null;
      
      return jwt.verify(token, getJWTSecret());
    } catch (error) {
      console.error(['[Auth.authUser] Error:', error.message]);
      return null;
    }
  }

  async killSession(res) {
    const optsExpire = { httpOnly: true, path: '/', expires: new Date(0) };

    try {
      if (loopar.cookie && typeof loopar.cookie.remove === 'function') {
        await loopar.cookie.remove(this.tokenName).catch(() => {});
        await loopar.cookie.remove(this.loggedCookieName).catch(() => {});
      }
    } catch (e) {}

    try {
      if (res && loopar.cookie && typeof loopar.cookie.remove === 'function') {
        await loopar.cookie.remove(res, this.tokenName).catch(() => {});
        await loopar.cookie.remove(res, this.loggedCookieName).catch(() => {});
      }
    } catch (e) {}

    try {
      if (loopar.cookie && typeof loopar.cookie.set === 'function') {
        await loopar.cookie.set(this.tokenName, '', optsExpire).catch(() => {});
        await loopar.cookie.set(this.loggedCookieName, '', optsExpire).catch(() => {});
        if (res) {
          await loopar.cookie.set(res, this.tokenName, '', optsExpire).catch(() => {});
          await loopar.cookie.set(res, this.loggedCookieName, '', optsExpire).catch(() => {});
        }
      }
    } catch (e) {}

    try {
      if (res && typeof res.clearCookie === 'function') {
        res.clearCookie(this.tokenName, { path: '/' });
        res.clearCookie(this.loggedCookieName, { path: '/' });
      }
    } catch (e) {}
  }

  async logout() {
    loopar.cookie.remove(this.loggedCookieName);
    return this.killSession();
  }

  async award() {
    const token = loopar.cookie.get(this.tokenName);
    
    if (!token) return this.killSession();

    try {
      const userData = jwt.verify(token, getJWTSecret(), { ignoreExpiration: true });

      if (!userData) return this.killSession();

      if (await this.disabledUser?.(userData?.name)) return this.killSession();

      const now = Math.floor(Date.now() / 1000);
      const exp = userData.exp || 0;

      if (exp - now < REFRESH_THRESHOLD) {
        const payload = {
          name: userData.name,
          email: userData.email,
          avatar: userData.avatar,
          profile_picture: userData.profile_picture,
          tenant: this.tenantId
        };

        const newToken = jwt.sign(payload, getJWTSecret(), { expiresIn: '1d' });
        await loopar.cookie.set(this.tokenName, newToken, { httpOnly: true, path: '/' });
        await loopar.cookie.set(this.loggedCookieName, '1', { httpOnly: false, path: '/' });
        
        return payload;
      }

      return {
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        profile_picture: userData.profile_picture,
        tenant: userData.tenant || this.tenantId,
        exp: userData.exp,
        iat: userData.iat
      };
    } catch (error) {
      return this.killSession();
    }
  }

  login(user) {
    const payload = {
      name: user.name,
      email: user.email,
      avatar: user.name.substring(0, 1).toUpperCase(),
      profile_picture: user.profile_picture,
      tenant: this.tenantId
    };

    const token = jwt.sign(payload, getJWTSecret(), { expiresIn: '1d' });
  
    loopar.cookie.set(this.tokenName, token, { httpOnly: true, path: '/' });
    loopar.cookie.set(this.loggedCookieName, '1', { httpOnly: false, path: '/' });

    return payload;
  }

  validateTenant(userData) {
    if (userData.tenant && userData.tenant !== this.tenantId) {
      console.warn(`[Auth] Token tenant mismatch: expected ${this.tenantId}, got ${userData.tenant}`);
      return false;
    }
    return true;
  }
}