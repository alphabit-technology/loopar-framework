import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "./App.tsx";
import { Loader } from "@loopar/loader";
import { ErrorBoundary } from "@error-boundary";

(async () => {
  const __META_SCRIPT__ = document.getElementById('__loopar-meta-data__');
  const __META__ = JSON.parse(__META_SCRIPT__?.textContent || "{}");
  const { Workspace, View } = await Loader(__META__, "client");

  window.lastY = 0;
  window.verticalDirection = null;

  ReactDOM.hydrateRoot(
    document.getElementById("__[loopar-root]__"),
    <BrowserRouter>
      <ErrorBoundary>
        <App
          __META__={{
            ...__META__,
            components: {Workspace, View},
            environment: "client",
            services: {}
          }}
        />
      </ErrorBoundary>
    </BrowserRouter>
  );
})();