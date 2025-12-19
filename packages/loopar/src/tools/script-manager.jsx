class ScriptManager {
  constructor() {
    this.scripts = {};
    this.stylesheets = {};
  }

  loadStylesheet(href, { callback, options = { position: "before", target: null } } = {}) {
    const fullHref = href + ".css";
    
    if (this.stylesheets[href]?.loaded) {
      callback?.();
      return Promise.resolve();
    }

    if (this.stylesheets[href]?.promise) {
      return this.stylesheets[href].promise.then(() => callback?.());
    }

    const promise = new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = fullHref;

      link.onload = () => {
        this.stylesheets[href].loaded = true;
        callback?.();
        resolve();
      };

      link.onerror = reject;

      if (options.target) {
        const target = document.head.querySelector(options.target);
        if (target) {
          if (options.position === "before") {
            target.parentNode.insertBefore(link, target);
          } else {
            target.parentNode.insertBefore(link, target.nextSibling);
          }
        } else {
          document.head.appendChild(link);
        }
      } else {
        document.head.insertBefore(link, document.head.firstChild);
      }

      this.stylesheets[href].element = link;
    });

    this.stylesheets[href] = { loaded: false, promise, element: null };
    return promise;
  }

  loadScript(src, callback, options = { async: true, addExtension: true, position: "append", target: null }) {
    const fullSrc = options.addExtension !== false ? src + ".js" : src;

    if (this.scripts[src]?.loaded) {
      callback?.();
      return Promise.resolve();
    }

    if (this.scripts[src]?.promise) {
      return this.scripts[src].promise.then(() => callback?.());
    }

    const scriptState = {
      loaded: false,
      promise: null,
      element: null
    };
    
    this.scripts[src] = scriptState;

    scriptState.promise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = fullSrc;
      script.async = options.async ?? true;

      script.onload = () => {
        scriptState.loaded = true;
        callback?.();
        resolve();
      };

      script.onerror = (e) => {
        reject(e);
      };

      // Insertar según la posición especificada
      const { position = "append", target } = options;
      
      if (target) {
        const targetElement = typeof target === "string" 
          ? document.head.querySelector(target) 
          : target;
        
        if (targetElement) {
          if (position === "before") {
            targetElement.parentNode.insertBefore(script, targetElement);
          } else if (position === "after") {
            targetElement.parentNode.insertBefore(script, targetElement.nextSibling);
          } else {
            document.head.appendChild(script);
          }
        } else {
          document.head.appendChild(script);
        }
      } else {
        // Sin target específico
        if (position === "prepend") {
          document.head.insertBefore(script, document.head.firstChild);
        } else if (position === "first-script") {
          const firstScript = document.head.querySelector("script");
          if (firstScript) {
            firstScript.parentNode.insertBefore(script, firstScript);
          } else {
            document.head.appendChild(script);
          }
        } else if (position === "last-style") {
          const styles = document.head.querySelectorAll("style, link[rel='stylesheet']");
          const lastStyle = styles[styles.length - 1];
          if (lastStyle) {
            lastStyle.parentNode.insertBefore(script, lastStyle.nextSibling);
          } else {
            document.head.appendChild(script);
          }
        } else {
          document.head.appendChild(script);
        }
      }

      scriptState.element = script;
    });

    return scriptState.promise;
  }

  unloadScript(src) {
    if (this.scripts[src]?.element) {
      this.scripts[src].element.remove();
      delete this.scripts[src];
    }
  }

  unloadStylesheet(href) {
    if (this.stylesheets[href]?.element) {
      this.stylesheets[href].element.remove();
      delete this.stylesheets[href];
    }
  }

  unloadAll() {
    Object.keys(this.scripts).forEach(src => this.unloadScript(src));
    Object.keys(this.stylesheets).forEach(href => this.unloadStylesheet(href));
  }
}

export default new ScriptManager();