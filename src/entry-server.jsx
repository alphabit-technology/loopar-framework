import React from "react";
import {renderToString } from "react-dom/server";
import App from "@/App";
import { StaticRouter } from "react-router";
import { Loader } from "@loopar/loader";
import {ServerCookiesManager} from '@services/cookie';
import { __META_COMPONENTS__ } from "@loopar/components-loader";

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
  const { Workspace, Document } = await Loader(__META__, "server");
  global.__REQUIRE_COMPONENTS__ = [];
  global.ENVIRONMENT = "server";

  const context = {};
  const HTML = renderToString(
    <Main
      Workspace={Workspace}
      Document={Document}
      location={url}
      context={context}
      __META__={__META__}
      req={req}
      res={res}
    />,
    context
  );

  if (context.url) {
    return {
      redirect: context.url,
    };
  }

  __META__.__REQUIRE_COMPONENTS__ = global.__REQUIRE_COMPONENTS__;
  return {
    HTML
  };
}