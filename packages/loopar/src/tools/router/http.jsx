export default class HTTP {
  #jsonQuery = {};
  #options = {};

  /**
   * Low-level transport. Sends an HTTP request to a literal URL.
   *
   * Most app code SHOULD NOT call this directly. Prefer:
   *   - loopar.call(Doc, action, params)        ← high-level RPC sugar
   *   - loopar.api.{get|post|put|patch|delete}  ← verb-explicit RPC
   *
   * Both of those build the URL as /api/{Document}/{action} automatically
   * and run through send() under the hood. Use send() directly only when:
   *   1. The URL cannot be expressed as /api/{Doc}/{action} — e.g. SPA
   *      page-meta bootstrap (workspace-provider) or external endpoints.
   *   2. A form posts to its own page URL (login, install, connect) and
   *      depends on the workspace-as-router pattern.
   *
   * @param {Object} options
   * @param {string} options.action - Literal URL (relative or absolute).
   * @param {string} [options.method="POST"]
   * @param {Object|FormData} [options.body]
   * @param {Object|string} [options.query]
   * @param {Function} [options.success]
   * @param {Function} [options.error]
   * @param {Function} [options.always]
   * @param {boolean}  [options.freeze]
   */
  send(options) {
    this.#options = options;
    return this.#sendPetition(options);
  }

  get __method__() { return this.#options.method || "POST" }
  get __action__() { return this.#options.action }
  get __body__() { return this.#options.body }
  get __query__() {
    const query = this.#options.query;
    if (this.utils.isJSON(query)) {
      this.#jsonQuery = this.utils.JSONParse(query);
    } else {
      this.#jsonQuery = query;
    }

    if (typeof this.#jsonQuery === "object" && this.#jsonQuery !== null) {
      return "?" + Object.keys(this.#jsonQuery)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(this.#jsonQuery[k])}`)
        .join("&");
    } else {
      return this.#jsonQuery;
    }
  }

  get url() {
    return `${this.__action__}${this.__query__ || ''}`;
  }

  getCsrfToken() {
    const fromMeta =
      typeof globalThis !== 'undefined' ? globalThis.__csrfToken__ : undefined;
    const fromWindow =
      typeof window !== 'undefined' ? window.__csrfToken__ : undefined;
    const fromCookie = document.cookie
      .split('; ')
      .find((r) => r.startsWith('csrf-token='))
      ?.split('=')
      .slice(1)
      .join('=');
    return fromMeta || fromWindow || fromCookie || '';
  }

  get options() {
    const options = {
      method: this.__method__, // *GET, POST, PUT, DELETE, etc.
      mode: 'same-origin', // no-cors, *cors, same-origin
      cache: 'default', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'include', // include, *same-origin, omit
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: this.__body__, // body data type must match "Content-Type" header),
    };

    const csrf = this.getCsrfToken();

    if (this.__body__ instanceof FormData) {
      options.body = this.__body__;
      if (csrf) {
        options.headers = { 'X-CSRF-Token': csrf };
      }
    } else {
      options.headers = {
        'Content-Type': 'application/json',
        'X-CSRF-Token': csrf,
      };
      options.body = JSON.stringify(this.__body__);
    }

    return Object.entries(options).reduce((acc, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        acc[key] = value;
      }
      return acc;
    }, {});
  }

  async #sendPetition(options) {
    const self = this;
    const freeze = options.freeze !== false;

    const withFreeze = async (promise, delay = 200) => {
      if (!freeze) return promise;

      let freezeTimeout;
      const startFreeze = new Promise(resolve => {
        freezeTimeout = setTimeout(() => {
          self.freeze(true);
          resolve();
        }, delay);
      });

      try {
        return await Promise.race([startFreeze, promise]).then(() => promise);
      } finally {
        clearTimeout(freezeTimeout);
        self.freeze(false);
      }
    };

    try {
      const fetchPromise = fetch(self.url, self.options)
        .then(async response => {
          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : null;

          if (!response.ok || (response.status && response.status !== 200)) {
            throw (data || {
              status: response.status,
              code: response.status,
              title: response.statusText || 'Request Error',
              message: response.statusText || `Request failed with status ${response.status}`
            });
          }

          if (options.success) {
            options.success?.(data?.message || data);
          }

          if (data?.redirect) {
            setTimeout(() => {
              window.location.href = data.redirect;
            }, 0);
            return data;
          }

          data?.notify && self.notify(data.notify);

          return data;
        });

      return await withFreeze(fetchPromise);
    } catch (error) {
      if (error?.redirect) {
        setTimeout(() => {
          window.location.href = error.redirect;
        }, 0);
        return;
      }

      if (options.error) {
        self.notify(error.notify || {
          message: error.message,
          type: "error"
        });
        options.error(error);
      } else {
        self.throw({
          code: error.code,
          title: error.title || 'Error',
          message: error.message || 'An unexpected error occurred',
        });
      }
    } finally {
      options.always?.();
    }
  }

  get(url, query, options = {}) {
    return this.send({
      method: 'GET',
      action: url,
      query: query,
      ...options,
    });
  }

  post(url, query, options = {}) {
    return this.send({
      method: 'POST',
      action: url,
      query: query,
      body: options.body,
      ...options,
    });
  }
}