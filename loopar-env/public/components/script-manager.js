class ScriptManager {
    constructor() {
        this.scripts = [];
    }

    /*
    const documentHeader = document.querySelector("head");
      const script = document.createElement("script");
      script.src = "https://js.stripe.com/v3/pricing-table.js";
      script.async = true;
      documentHeader.appendChild(script);*/

    loadStylesheet(href, callback) {
      return new Promise((resolve, reject) => {
        const existingLink = document.querySelector(`link[href="${href}.css"]`);
        if (existingLink) {
          resolve();
          callback && callback();
          return;
        }
    
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href+".css";
        link.onload = () => {
          resolve();
          callback && callback();
        }
        link.onerror = () => {
          reject();
        }

        document.head.insertBefore(link, document.head.firstChild);
      });
    }

    loadScript(src, callback) {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}.js"]`);
        this.scripts[src] = this.scripts[src] || {loaded: false, callbacks: []};

        const makeScript = () => {
          const script = document.createElement('script');
          script.src = src + ".js";
          script.async = true;
          script.onload = () => {
            this.scripts[src].callbacks.forEach((callback, index) => {
              callback();
            });

            this.scripts[src].loaded = true;
            resolve();
          }
          script.onerror = () => {
            this.scripts[src].loaded = false;
            reject();
          }
          document.head.appendChild(script);
        }
        
        if (existingScript) {
          if(this.scripts[src].loaded){
            callback && callback();
          }else{
            this.scripts[src].callbacks.push(callback);
          }
          resolve();
        }else{
          this.scripts[src].callbacks.push(callback);
          makeScript();
        }
      });
    }

    unloadScripts() {
        this.scripts.forEach(script => {
            script.remove();
        });
        this.scripts = [];
    }
}

export const scriptManager = new ScriptManager();