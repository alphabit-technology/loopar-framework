import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { Loader } from "@loopar/loader";

(async () => {
  const __META_SCRIPT__ = document.getElementById('__loopar-meta-data__');
  const __META__ = JSON.parse(__META_SCRIPT__?.textContent || "{}");
  const { Workspace, Document } = await Loader(__META__, "client");

  function getCookie(name) {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (key === name) return decodeURIComponent(value);
    }

    return null;
  }

  function award() {
    const isLogged = getCookie('logged') !== null;
    const currentUrl = window.location.pathname;

    if (currentUrl.startsWith('/desk/')) {
      !isLogged && (window.location.href = '/auth/login');
    } else if (currentUrl.startsWith('/auth/')) {
      isLogged && (window.location.href = '/desk/Desk View/view');
    }
  }

  window.addEventListener('popstate', function (e) {
    e.stopPropagation();
    award();
  });

  window.addEventListener('pageshow', function (e) {
    e.stopPropagation();
    //award();
  })

  window.lastY = 0;
  window.verticalDirection = null;

  ReactDOM.hydrateRoot(
    document.getElementById("loopar-root"),
    <BrowserRouter>
      <App
        __META__={__META__}
        Workspace={Workspace}
        Document={Document}
        ENVIRONMENT="client"
      />
    </BrowserRouter>
  );
})();