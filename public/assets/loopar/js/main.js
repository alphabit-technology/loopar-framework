const [DOWN, UP] = ['down', 'up'];

var verticalDirection = DOWN;
var lastY = 0;

document.addEventListener('mousemove', e => {
  if (lastY < e.clientY) {
    verticalDirection = DOWN;
  } else {
    verticalDirection = UP;
  }

  lastY = e.clientY;
});

function loadStylesheet(href, { callback, options } = {}) {
  const { defer = false, position = "before", target = null } = options || {};

  return new Promise((resolve, reject) => {
    const existingLink = document.querySelector(`link[href="${href}.css"]`);

    if (existingLink) {
      return resolve();
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href + ".css";
    link.defer = defer;

    link.onload = () => {
      resolve();
    }
    link.onerror = () => {
      reject();
    }

    if (target) {
      const Target = document.head.querySelector(target);

      if (position === "before") {
        Target.parentNode.insertBefore(link, target);
      } else {
        Target.parentNode.insertBefore(link, Target.nextSibling);
      }
    } else {
      document.head.insertBefore(link, document.head.firstChild);
    }
  });
}

function loadScript(src, callback, options = { async: true }) {
  return new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${src}.js"]`);
    window.scripts ??= {};
    window.scripts[src] = window.scripts[src] || { loaded: false, callbacks: [] };

    const makeScript = () => {
      const script = document.createElement('script');
      script.src = src + ".js";
      script.async = options.async;
      script.onload = () => {
        window.scripts[src].callbacks.forEach((callback) => {
          callback();
        });

        window.scripts[src].loaded = true;
        resolve();
      }
      script.onerror = () => {
        window.scripts[src].loaded = false;
        reject();
      }
      document.head.appendChild(script);
    }

    if (existingScript) {
      if (window.scripts[src].loaded) {
        resolve(callback && callback());
      } else {
        resolve(callback && window.scripts[src].callbacks.push(callback));
      }
    } else {
      callback && window.scripts[src].callbacks.push(callback);
      makeScript();
    }
  });
}