export default class HTTP {
  #jsonParams = {};
  #options = {};

  send(options) {
    this.#options = options;
    this.#sendPetition(options);
  }

  get __method__() { return this.#options.method || "POST" }
  get __action__() { return this.#options.action }
  get __body__() { return this.#options.body }
  get __params__() {
    const params = this.#options.params;
    if (this.utils.isJSON(params)) {
      this.#jsonParams = this.utils.JSONParse(params);
    } else {
      this.#jsonParams = params;
    }

    if (typeof this.#jsonParams == "object") {
      return "?" + Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
    } else {
      return this.#jsonParams;
    }
  }

  get url() {
    return `${this.__action__}${this.__params__ || ''}`;
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

    if (!(this.__body__ instanceof FormData)) {
      options.headers = {
        'Content-Type': 'application/json',
      };

      options.body = JSON.stringify(this.__body__);
    }

    return Object.entries(options).reduce((acc, [key, value]) => {
      value && (acc[key] = value);
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

          if (!response.ok) {
            const error = data || { error: response.status, message: response.statusText };
            throw error;
          }

          if(options.success) {
             options.success?.(data);
          } else if (response.redirected) {
            window.location.href = response.url;
            return;
          }

          data?.notify && self.notify(data.notify);

          return data;
        });

      return await withFreeze(fetchPromise);
    } catch (error) {
      options.error?.(error);
      self.throw({
        title: error.title || error.code || 'Undefined Error',
        message: error.message || error.description || 'Undefined Error',
      });
    } finally {
      options.always?.();
    }
  }

  get(url, params, options = {}) {
    return this.send({
      method: 'GET',
      action: url,
      params: params,
      ...options,
    });
  }

  post(url, params, options = {}) {
    this.send({
      method: 'POST',
      action: url,
      params: params,
      body: options.body,
      ...options,
    });
  }
}