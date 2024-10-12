import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "@app";
import { StaticRouter } from "react-router-dom";
import { Loader } from "@/loader";
import { ServerCookiesManager } from '@services/cookie';
import { __META_COMPONENTS__ } from "@components-loader";


const Main = ({ Workspace, Document, url, context, __META__, req, res }) => {
  const cookieManager = new ServerCookiesManager(req, res);

  return (
    <React.StrictMode>
      <StaticRouter
        location={url}
        context={context}
      >
        <App
          __META__={__META__}
          Document={Document}
          Workspace={Workspace}
          ENVIRONMENT="server"
          cookieManager={cookieManager}
        />
      </StaticRouter>
    </React.StrictMode>
  );
};

export async function render(url, __META__, req, res) {
  //__META__ = JSON.parse(__META__);
  const { Workspace, Document } = await Loader(__META__, "server");
  global.__REQUIRE_COMPONENTS__ = [];
  global.ENVIRONMENT = "server";

  const context = {};
  const HTML = ReactDOMServer.renderToString(
    React.createElement(Main, {
      Workspace,
      Document,
      location: url,
      context,
      __META__,
      req,
      res
    })
  );

  if (context.url) {
    return {
      redirect: context.url,
    };
  }

  __META__.__REQUIRE_COMPONENTS__ = global.__REQUIRE_COMPONENTS__;
  return {
    HTML,
  };
}