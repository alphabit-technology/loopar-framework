import React from "react";
import ReactDOMServer from "react-dom/server";
import App from "$app";
import { StaticRouter } from "react-router-dom";
import {Loader} from "@/loader";

export async function renderPage(url, __META__) {
  const { Workspace, Document } = await Loader(__META__, "server");

  const context = {};
  const appHtml = ReactDOMServer.renderToString(
    React.createElement(
      StaticRouter,
      {
        location: url,
        context,
      },
      React.createElement(App, {
        __META__,
        Document,
        Workspace,
        ENVIRONMENT: "server",
      })
    )
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
