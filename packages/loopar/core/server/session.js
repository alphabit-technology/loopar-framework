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
      resolve && resolve();
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

export class Cookie {
  #cookies = {};
  #res = null;
  #req = null;

  get res() {
    return this.#res;
  }

  set res(res) {
    this.#res = res;
  }

  set req(req) {
    this.#req = req;
  }

  get cookies() {
    return this.#cookies;
  }

  set cookies(cookies) {
    this.#cookies = cookies || {};
  }

  set(name, value, options = {}) {
    const defaultOptions = {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      ...options
    };

    if (this.#res && typeof this.#res.cookie === 'function') {
      this.#res.cookie(name, value, defaultOptions);
      this.#cookies[name] = value;
    }
  }

  get(name) {
    let value = null;

    if (this.#cookies && this.#cookies[name]) {
      value = this.#cookies[name];
    }

    else if (this.#req?.cookies?.[name]) {
      value = this.#req.cookies[name];
      this.#cookies[name] = value;
    }

    else if (this.#req?.signedCookies?.[name]) {
      value = this.#req.signedCookies[name];
      this.#cookies[name] = value;
    }

    if (value === 'undefined') return undefined;
    if (value === 'true') return true;
    if (value === 'false') return false;

    return value;
  }

  remove(name, options = {}) {
    if (this.#res && typeof this.#res.clearCookie === 'function') {
      this.#res.clearCookie(name, { path: '/', ...options });
    }
    
    delete this.#cookies[name];
  }
}