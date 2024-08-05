const __META_COMPONENTS__ = {};
import loopar from "$loopar";
import {MetaComponents} from "@global/require-components";

function getComponent(component, pre = "./") {
  if(!component) return null;
  const cParse = component.replaceAll(/_/g, "-");
  return new Promise((resolve) => {
    if (__META_COMPONENTS__[component]) {
      resolve(__META_COMPONENTS__[component]);
    } else {
      import(`./components/${cParse}.jsx`).then((c) => {
        const promises = [];

        if (c?.default?.prototype?.requires && typeof window !== "undefined") {
          const requires = c.default.prototype.requires;

          if (requires.css) {
            for (const css of requires.css) {
              promises.push(loopar.includeCSS(css));
            }
          }

          if (requires.js) {
            for (const js of requires.js) {
              promises.push(loopar.require(js));
            }
          }

          if (requires.modules) {
            promises.push(
              ComponentsLoader(requires.modules.filter((m) => m !== component))
            );
          }
        }

        Promise.all(promises).then(() => {
          __META_COMPONENTS__[component] = c;
          resolve(c);
        }).catch((error) => {
          console.error("Err on load Resourse: " + component, error);
        });
      });
    }
  });
}

async function ComponentsLoader(components, callback) {
  const promises = Array.from(new Set(components)).map((c) => getComponent(c));
  return Promise.all(promises).then(callback);
}

async function MetaComponentsLoader(__META__, environment) {
  await ComponentsLoader(environment === "server" ? MetaComponents(__META__, environment) : __META__.__REQUIRE_COMPONENTS__);
}

export { MetaComponentsLoader, __META_COMPONENTS__, ComponentsLoader };
