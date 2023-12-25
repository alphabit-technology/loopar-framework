class ScriptManager {
    constructor() {
        this.scripts = [];
    }

    loadStylesheet(href, { callback, options = { defer: true, position: "before", target: null } } = {}) {
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
        link.defer = options.defer;
        link.onload = () => {
          resolve();
          callback && callback();
        }
        link.onerror = () => {
          reject();
        }

        if(options.target){
          const target = document.head.querySelector(options.target);

          if(options.position === "before"){
            target.parentNode.insertBefore(link, target);
          }else{
            target.parentNode.insertBefore(link, target.nextSibling);
          }
        }else{
          document.head.insertBefore(link, document.head.firstChild);
        }
      });
    }

    loadScript(src, callback, options = { async: true}) {
      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}.js"]`);
        this.scripts[src] = this.scripts[src] || {loaded: false, callbacks: []};

        const makeScript = () => {
          const script = document.createElement('script');
          script.src = src + ".js";
          script.async = options.async;
          script.onload = () => {
            this.scripts[src].callbacks.forEach((callback) => {
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
            callback && this.scripts[src].callbacks.push(callback);
          }
          resolve();
        }else{
          callback && this.scripts[src].callbacks.push(callback);
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

export default new ScriptManager();