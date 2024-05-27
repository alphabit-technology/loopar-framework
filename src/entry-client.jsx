import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "$app";
import { Loader } from "@/loader";
//import { CookiesProvider } from '@services/cookie';

const { Workspace, Document } = await Loader(__META__, "client");

(() => {
  ReactDOM.hydrateRoot(
    document.getElementById("loopar-root"),
    //document,
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