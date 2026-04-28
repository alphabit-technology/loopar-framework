export default class HTTP {
  #jsonQuery = {};
  #options = {};

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
            throw (data || { error: response.status, message: response.statusText });
            //throw error;
          }

          if(options.success) {
             options.success?.(data?.message || data);
          }

          if(response.redirected) {
            setTimeout(() => {
              window.location.href = response.url;
            }, 0);
            return;
          }

          data?.notify && self.notify(data.notify);

          return data;
        });

      return await withFreeze(fetchPromise);
    } catch (error) {
      if(options.error){
        self.notify(error.notify || {
          message: error.message || error.description || error.title,
          type: "error"
        });
        options.error(error);
      }else{
        self.throw({
          title: error.title || error.code || 'Undefined Error',
          message: error.message || error.description || 'Undefined Error',
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