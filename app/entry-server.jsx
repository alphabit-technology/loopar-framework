import React from "react";
import {renderToString } from "react-dom/server";
import App from "./App.tsx";
import { StaticRouter } from "react-router";
import { Loader } from "@loopar/loader";
import {ServerCookiesManager} from '@services/cookie';
import { __META_COMPONENTS__, ComponentsLoader } from "@loopar/components-loader";

const Main = ({ __META__, pathname, context, req, res, permissions }) => {
  const cookieManager = new ServerCookiesManager(req, res);

  return (
    <React.StrictMode>
      <StaticRouter
        location={pathname}
        context={context}
      >
        <App
          __META__={{
            ...__META__,
            services: { cookieManager },
            environment: "server"
          }}
          permissions={permissions}
          pathname={pathname}
        />
      </StaticRouter>
    </React.StrictMode>
  );
};

export async function render(pathname, __META__, req, res, permissions) {
  const { Workspace, View } = await Loader(__META__, "server");
  global.__REQUIRE_COMPONENTS__ = [];
  global.ENVIRONMENT = "server";

  const context = {};
  const doRender = () => renderToString(
    <Main
      pathname={pathname}
      __META__={{
        ...__META__,
        components: { Workspace, View }
      }}
      req={req}
      res={res}
      permissions={permissions}
    />,
    context
  );

  let HTML = doRender();

  // Runtime-generated elements (e.g. gallery rows → `image`) aren't in the
  // doc_structure, so their components aren't preloaded: the server renders
  // them empty and the client doesn't → hydration mismatch. Load whatever
  // the render discovered and re-render until nothing new appears.
  for (let pass = 0; pass < 3; pass++) {
    const missing = Array.from(new Set(global.__REQUIRE_COMPONENTS__))
      .filter((c) => c && !__META_COMPONENTS__[c]);
    if (!missing.length) break;

    await ComponentsLoader(missing);
    global.__REQUIRE_COMPONENTS__ = [];
    HTML = doRender();
  }

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