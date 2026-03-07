class AsyncLocalStorage{
  #req = {};
  #res = {}

  set req(req){
    this.#req = req;
  }

  get req(){
    return this.#req;
  }

  set res(res){
    this.#res = res;
  }

  get res(){
    return this.#res
  }

  getStore(){
    return {
      req: this.#req,
      res: this.#res
    }
  }

  run({req, res}={}, next){
    this.req = req;
    this.res = res;
    next();
  }
}

export const requestContext = new AsyncLocalStorage();

/**
 * Get the current request context
 * @returns {{ req: Object, res: Object } | undefined}
 */
export function getContext() {
  return requestContext.getStore();
}

/**
 * Get the current request object
 * @returns {Object | undefined}
 */
export function getRequest() {
  return getContext()?.req;
}

/**
 * Get the current response object
 * @returns {Object | undefined}
 */
export function getResponse() {
  return getContext()?.res;
}

/**
 * Cookie Manager - handles cookie operations using request context
 */
export const cookieManager = {
  /**
   * Get a cookie value
   * @param {string} name - Cookie name
   * @returns {string | undefined}
   */
  get(name) {
    const req = getRequest();
    if (!req) return undefined;
    
    // Support both parsed cookies and raw cookies
    if (req.cookies) {
      return req.cookies[name];
    }
    
    // Fallback to parsing cookie header
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) return undefined;
    
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
      const [key, value] = cookie.trim().split('=');
      acc[key] = decodeURIComponent(value || '');
      return acc;
    }, {});
    
    return cookies[name];
  },

  /**
   * Set a cookie
   * @param {string} name - Cookie name
   * @param {string} value - Cookie value
   * @param {Object} options - Cookie options (maxAge, httpOnly, secure, etc.)
   */
  set(name, value, options = {}) {
    const res = getResponse();
    if (!res || res.headersSent) return;
    
    res.cookie(name, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      ...options
    });
  },

  /**
   * Remove a cookie
   * @param {string} name - Cookie name
   * @param {Object} options - Cookie options
   */
  remove(name, options = {}) {
    const res = getResponse();
    if (!res || res.headersSent) return;
    
    res.clearCookie(name, options);
  },

  /**
   * Get all cookies
   * @returns {Object}
   */
  getAll() {
    const req = getRequest();
    return req?.cookies || {};
  }
};

/**
 * Session Manager - handles session operations using request context
 */
export const sessionManager = {
  /**
   * Get a session value
   * @param {string} key - Session key
   * @returns {any}
   */
  get(key) {
    const req = getRequest();
    if (!req?.session) return undefined;
    return key ? req.session[key] : req.session;
  },

  /**
   * Set a session value
   * @param {string} key - Session key
   * @param {any} value - Session value
   */
  set(key, value) {
    const req = getRequest();
    if (!req?.session) return;
    req.session[key] = value;
  },

  /**
   * Remove a session value
   * @param {string} key - Session key
   */
  remove(key) {
    const req = getRequest();
    if (!req?.session) return;
    delete req.session[key];
  },

  /**
   * Destroy the session
   * @returns {Promise<void>}
   */
  destroy() {
    return new Promise((resolve, reject) => {
      const req = getRequest();
      if (!req?.session?.destroy) {
        resolve();
        return;
      }
      req.session.destroy((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  },

  /**
   * Get the full session object
   * @returns {Object | undefined}
   */
  getAll() {
    const req = getRequest();
    return req?.session;
  }
};