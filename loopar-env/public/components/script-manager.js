class ScriptManager {
    constructor() {
        this.scripts = [];
    }

    loadScript(src) {
        return new Promise((resolve, reject) => {
          const existingScript = document.querySelector(`script[src="${src}"]`);
          if (existingScript) {
            resolve();
            return;
          }
      
          const script = document.createElement('script');
          script.src = src;
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
          this.scripts.push(script);
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