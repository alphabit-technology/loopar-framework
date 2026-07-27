const __META_COMPONENTS__ = {};
import loopar from "loopar";
import {MetaComponents} from "@global/require-components";
import { MetaLoadError } from "./components/meta/meta-load-error";

const components = Object.entries(import.meta.glob(['./components/*.jsx'])).reduce((acc, [path, module]) => {
  acc['src/' + path.split('/').pop().replace('.jsx', '')] = module;
  return acc;
}, {});

function makeFailedComponent(component, error) {
  const Failed = () => <MetaLoadError element={component} error={error} />;
  return { default: Failed, __loadFailed: true };
}

function getComponent(component) {
  if(!component) return null;
  const cParse = component.replaceAll(/_/g, "-");

  return new Promise((resolve) => {
    const cached = __META_COMPONENTS__[component];
    if (cached && !cached.__loadFailed) {
      resolve(cached);
      return;
    }

    const moduleImport = components[`src/${cParse}`] || components[`src/generic`] || null;
    if(!moduleImport) {
      console.warn("Component not found: " + component);
      resolve(null);
      return;
    }

    const onFailure = (error) => {
      console.error(`Failed to load component "${component}"`, error);
      const failed = makeFailedComponent(component, error);
      __META_COMPONENTS__[component] = failed;
      resolve(failed);
    };

    moduleImport().then((c) => {
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
        if(c.default) {
          __META_COMPONENTS__[component] = c;
          resolve(c);
        }else{
          resolve(null)
        }
      }).catch(onFailure);
    }).catch(onFailure);
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
