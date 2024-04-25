import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "$app";
import { Loader } from "@/loader";

const { Workspace, Document } = await Loader(__META__, "client");

(() => {
  ReactDOM.hydrateRoot(
    document.getElementById("loopar-root"),
    <BrowserRouter>
      <App
        __META__={__META__}
        Document={Document}
        Workspace={Workspace}
        ENVIRONMENT="client"
      />
    </BrowserRouter>
  );
})();