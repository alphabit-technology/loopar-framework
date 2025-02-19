import jwt from 'jsonwebtoken';

export default class Auth {
  constructor(cookie, getUser, disabledUser) {
    this.cookie = cookie;
    this.getUser = getUser;
    this.disabledUser = disabledUser;
  }

  authUser() {
    try {
      return jwt.verify(this.cookie.get('auth_token'), 'user-auth');
    } catch (error) {
      return null;
    }
  }

  killSession() {
    this.cookie.remove('auth_token');
    this.cookie.remove('logged');
  }

  async logout() {
    this.cookie.remove('auth_token');
    this.cookie.remove('logged');
  }

  async award() {
    const token = this.cookie.get('auth_token');

    if (!token) return this.killSession();

    try {
      const userData = jwt.verify(token, 'user-auth', { ignoreExpiration: true });

      if(await this.disabledUser(userData?.name)) return this.killSession();

      const now = Math.floor(Date.now() / 1000);

      if (userData.exp - now < 1800) {
        const newToken = jwt.sign(userData, 'user-auth', { expiresIn: '1d' });
        this.cookie.set(res, 'auth_token', newToken, { httpOnly: true });
      }

      return userData;
    } catch (error) {
      console.log(["Award error", error]);
      return this.killSession();
    }
  }

  login(user) {
    const userData = {
      name: user.name,
      email: user.email,
      avatar: user.name.substring(0, 1).toUpperCase(),
      profile_picture: user.profile_picture,
    }

    const token = jwt.sign(userData, 'user-auth', { expiresIn: '1d' });
    this.cookie.set('auth_token', token, { httpOnly: true });
    this.cookie.set('logged', true);

    return userData;
  }
}
