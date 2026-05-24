export default class HTTP {
  #jsonQuery = {};
  #options = {};

  /**
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
    const fromCookie = this.cookie?.get('csrf-token');
    const fromGlobal =
      typeof globalThis !== 'undefined' ? globalThis.__csrfToken__ : undefined;
    return fromCookie || fromGlobal || '';
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

          if (data?.redirect) {
            if (data.hardRedirect) {
              window.location.replace(data.redirect);
            } else {
              self.navigate(data.redirect, { replace: true });
            }
            if (options.success) options.success?.(data?.message || data);
            return data;
          }

          if (options.success) {
            options.success?.(data?.message || data);
          }

          data?.notify && self.notify(data.notify);

          if (data?.refresh) {
            if (data.refresh === 'hard') {
              window.location.reload();
            } else {
              self.refresh();
            }
          }

          return data;
        });

      return await withFreeze(fetchPromise);
    } catch (error) {
      if (error?.redirect) {
        if (error.hardRedirect) {
          window.location.replace(error.redirect);
        } else {
          self.navigate(error.redirect, { replace: true });
        }
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