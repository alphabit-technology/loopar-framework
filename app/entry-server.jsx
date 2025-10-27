import React from "react";
import {renderToString } from "react-dom/server";
import App from "./App.tsx";
import { StaticRouter } from "react-router";
import { Loader } from "@loopar/loader";
import {ServerCookiesManager} from '@services/cookie';
import { __META_COMPONENTS__ } from "@loopar/components-loader";

const Main = ({ __META__, url, context, req, res }) => {
  const cookieManager = new ServerCookiesManager(req, res);

  return (
    <React.StrictMode>
      <StaticRouter
        location={url}
        context={context}
      >
        <App
          __META__={{
            ...__META__,
            services: { cookieManager },
            environment: "server",
          }}
        />
      </StaticRouter>
    </React.StrictMode>
  );
};

export async function render(url, __META__, req, res) {
  const { Workspace, View } = await Loader(__META__, "server");
  global.__REQUIRE_COMPONENTS__ = [];
  global.ENVIRONMENT = "server";

  const context = {};
  const HTML = renderToString(
    <Main
      location={url}
      __META__={{
        ...__META__,
        components: { Workspace, View }
      }}
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