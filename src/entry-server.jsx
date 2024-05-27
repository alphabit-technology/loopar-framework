import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "$app";
import { StaticRouter } from "react-router-dom";
import { Loader } from "@/loader";
import { ServerCookiesManager } from '@services/cookie';


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

export async function renderPage(url, __META__, req, res) {
  const { Workspace, Document } = await Loader(__META__, "server");

  const context = {};
  const appHtml = ReactDOMServer.renderToString(
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

  return {
    appHtml,
  };
}