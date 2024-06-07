export class Session {
  req = null;
  constructor() { }

  async set(key, value) {
    this.req.session[key] = value;

    return new Promise(resolve => {
      this.req.session.save(err => {
        if(err) throw new Error(err);
        resolve();
      });
    });
  }

  get(key, or = null) {
    return this.req.session[key] || or;
  }

  async delete(key) {
    delete this.req.session[key];
    return new Promise(resolve => {
      this.req.session.save(err => {
        if (err) throw new Error(err);
        resolve();
      });
    });
  }

  destroy(resolve) {
    this.req.session.destroy(err => {
      if (err) throw new Error(err);
      resolve();
    });
  }

  getID(resolve) {
    resolve(this.req.sessionID);
  }

  getCookie(resolve) {
    resolve(this.req.session.cookie);
  }

  setCookie(cookie, resolve) {
    this.req.session.cookie = cookie;
    this.req.session.save(err => {
      if (err) throw new Error(err);
      resolve();
    });
  }

  regenerate(resolve) {
    this.req.session.regenerate(err => {
      if (err) throw new Error(err);
      resolve();
    });
  }
}

export class Cookie{
  cookies = {};
  #res = null;

  set res(res) {
    this.#res = res;
  }

  set(name, value) {
    if(this.#res) this.#res.cookie(name, JSON.stringify({ key: value }));
  }

  get(name) {
    const value = this.cookies[name];
    if (value === 'undefined') {
      return undefined;
    }

    if (value === 'true') {
      return true;
    }

    if (value === 'false') {
      return false;
    }

    return value;
  }

  remove(name, options = {}) {
    this.#res.clearCookie(name, options);
    this.cookies = this.#res.cookies || {};
  }
}