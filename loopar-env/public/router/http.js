import {loopar} from '/loopar.js';

class HTTP {
   #json_params = {};
   #options = {};

   send(options) {
      this.#options = options;
      this.#send_petition(options);
   }

   get method() {return this.#options.method || "POST"}
   get action() {return this.#options.action}
   get body() {return this.#options.body}

   get params() {
      const params = this.#options.params;
      if (this.if_json(params)) {
         this.#json_params = this.json_parse(params);
      } else {
         this.#json_params = params;
      }

      if (typeof this.#json_params == "object") {
         return "?" + Object.keys(params).map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join('&');
      } else {
         return this.#json_params;
      }
   }

   get url() {
      return `${this.action}${this.params || ''}`;
   }

   get options() {
      const options = {
         method: this.method, // *GET, POST, PUT, DELETE, etc.
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
         body: this.body, // body data type must match "Content-Type" header),
      };

      if (!(this.body instanceof FormData)){
         options.headers = {
            'Content-Type': 'application/json',
         };

         options.body = JSON.stringify(this.body);
      }

      return options;
   }

   #send_petition(options) {
      const self = this;
      options.freeze && loopar.freeze(true);
      fetch(self.url, self.options).then(async response => {
         //console.log("response", response)
         //if(response.ok) {
            if (response.redirected) {
               window.location.href = response.url;
               return;
            }

            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : null;

            if (!response.ok) {
               const error = data || {error: response.status, message: response.statusText};
               throw new Error(error.content || error.message || error);
            } else {
               options.success && options.success(data);
            }
         //}
      }).catch(error => {
         options.error && options.error(error);
         //console.log(error)
         loopar.throw({
            title: error.error || 'Undefined Error',
            message: error.message || 'Undefined Error',
         });
      }).finally(() => {
         options.freeze && loopar.freeze(false);
         options.always && options.always();
      });
   }

   async get(url, params, options={}) {
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

   async post(url, params, options={}) {
      return new Promise((resolve, reject) => {
         this.send({
            method: 'POST',
            action: url,
            body: params,
            success: resolve,
            error: reject,
            ...options,
         });
      });
   }

   json_parse(json) {return this.if_json(json) ? JSON.parse(json) : json}

   if_json(json) {
      try {
         JSON.parse(json);
         return true;
      } catch (e) {
         return false;
      }
   }
}

export const http = new HTTP();

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