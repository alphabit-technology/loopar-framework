//import this from '$this';

export default class HTTP {
  #jsonParams = {};
  #options = {};

  async send(options) {
    this.#options = options;
    return await this.#sendPetition(options);
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
      /*headers: {
         //'Content-Type': 'application/json',
         //'x-xsrf-token':  "someCsrfToken",
         //'Content-Type': 'application/x-www-form-urlencoded',
         'Content-Type': 'multipart/form-data',
      },*/
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

  #sendPetition(options) {
    const self = this;
    options.freeze && self.freeze(true);

    return new Promise((resolve, reject) => {
      fetch(self.url, self.options).then(async response => {
        //return new Promise(async (resolve, reject) => {
          if (response.redirected) {
            window.location.href = response.url;
            return;
          }

          const isJson = response.headers.get('content-type')?.includes('application/json');
          const data = isJson ? await response.json() : null;

          if (!response.ok) {
            const error = data || { error: response.status, message: response.statusText };
            reject(error);
          } else {
            options.success && options.success(data);

            /*if (data && data.notify) {
              self.notify(data.notify);
            }*/
            resolve(data);
          }
       // });
      }).catch(error => {
        reject(error);
        /*options.error && options.error(error);
        self.rootApp?.progress(102);
        self.throw({
          title: error.title || error.code || 'Undefined Error',
          message: error.message || error.description || 'Undefined Error',
        });*/
      }).finally(() => {
        resolve();
        /*options.freeze && self.freeze(false);
        options.always && options.always();*/
      });
    });
  }

  async get(url, params, options = {}) {
    return new Promise((resolve, reject) => {
      return this.send({
        method: 'GET',
        action: url,
        params: params,
        success: resolve,
        error: reject,
        ...options,
      });
    });
  }

  async post(url, params, options = {}) {
    return new Promise((resolve, reject) => {
      this.send({
        method: 'POST',
        action: url,
        params: params,
        body: options.body || params,
        success: resolve,
        error: reject,
        ...options,
      });
    });
  }

  json_parse(json) { return this.if_json(json) ? JSON.parse(json) : json }

  if_json(json) {
    try {
      JSON.parse(json);
      return true;
    } catch (e) {
      return false;
    }
  }
}

//export default new HTTP();

/*fetch(self.url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'no-cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(this.#params.data) // body data type must match "Content-Type" header),
})*/