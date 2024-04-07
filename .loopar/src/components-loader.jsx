const Components = {};
import loopar from "$loopar";
import {elementsDict} from "@global/element-definition";
import {requireComponents} from "@/require-components";

let extractedElements = [];
const extractElements = (elements, environment) => {
  for (const el of elements || []) {
    
    const element = typeof el === "string" ? { element: el } : el;

    const def = elementsDict[element.element]?.def || {};

    if((environment !== "server" || !def.clientOnly)){
      element.element && extractedElements.push(element.element);

      if (element.elements) {
        extractElements(element.elements, environment);
      }
    }
  }
};

function getComponent(component, pre = "./") {
  if(!component) return null;
  
  const cParse = component.replaceAll(/_/g, "-");
  return new Promise((resolve) => {
    if (Components[component]) {
      resolve(Components[component]);
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
              loadComponents(requires.modules.filter((m) => m !== component))
            );
          }
        }

        Promise.all(promises)
          .then(() => {
            Components[component] = c;
            resolve(c);
          })
          .catch((error) => {
            console.error("Err on load Resourse: " + component, error);
          });
      });
    }
  });
}

async function loadComponents(components, callback) {
  const promises = Array.from(new Set(components)).map((c) => getComponent(c));
  return Promise.all(promises).then(callback);
}

async function ComponentsLoader(elementsList, environment) {
  extractElements(elementsList, environment);
  const elements = Array.from(new Set(extractedElements));
  await loadComponents(elements);
}

async function MetaComponentsLoader(__META__, environment) {
  await ComponentsLoader(requireComponents(__META__), environment);
}

export { ComponentsLoader, MetaComponentsLoader, Components };
