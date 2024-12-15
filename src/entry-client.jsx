import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router";
import App from "@app";
import { Loader } from "@/loader";

(async () => {
  const __META_SCRIPT__ = document.getElementById('__loopar-meta-data__');
  const __META__ = JSON.parse(__META_SCRIPT__?.textContent || "{}");
  const { Workspace, Document } = await Loader(__META__, "client");

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