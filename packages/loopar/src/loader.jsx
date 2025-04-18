import { WorkspaceLoader } from "@loopar/workspace-loader";
import { MetaComponentsLoader } from "@loopar/components-loader";
import React, { useEffect, lazy, useState, use } from "react";

import { loopar } from "loopar";

import { LoaderCircleIcon } from "lucide-react";

const Fallback = () => (
  <div className="flex flex-row justify-center items-center h-full">
    <LoaderCircleIcon className="animate-spin" size={150} />
  </div>
);

const appSources = Object.entries(import.meta.glob([
  '/apps/**/modules/**/**/**/client/*.jsx',
  '../apps/core/modules/**/**/**/client/*.jsx',
  './context/*.jsx',
])).reduce((acc, [path, module]) => {
  acc[path.split('/').pop().replace('.jsx', '')] = module;
  return acc;
}, {});

export async function AppSourceLoader(source) {
  if (!source) return null;

  return new Promise(async (resolve, reject) => {
    try {
      const moduleImport = appSources[source.client] || appSources[source.context];
      return resolve(moduleImport ? await moduleImport() : null)

    } catch (error) {
      reject(error);
      /*console.error(`Error importing module: ${source.client}`, error.stack);
      throw new Error(`Error importing module: ${source.client}`);*/
    }
  })

  /*try {
    const moduleImport = appSources[source.client] || appSources[source.context];
    return moduleImport ? await moduleImport() : null;
  } catch (error) {
    console.error(`Error importing module: ${source.client}`, error.stack);
    throw new Error(`Error importing module: ${source.client}`);
  }*/
}

export const Loader = (__META__, ENVIRONMENT) => {
  return new Promise((resolve) => {
    WorkspaceLoader(__META__.__WORKSPACE__.name).then(Workspace => {
      __META__.__DOCUMENT__ ? AppSourceLoader(__META__.__DOCUMENT__.client_importer).then(Document => {

        MetaComponentsLoader(__META__, ENVIRONMENT).then(() => {
          resolve({ Workspace: Workspace.default, Document: Document.default });
        })
      }) : resolve({ Workspace: Workspace.default, Document: null });
    });
  });
}

async function __loader__(source) {
  return new Promise((resolve) => {
    AppSourceLoader(source).then(module => {
      resolve(module);
    })
  });
}

function _Import(source) {
  return lazy(() => __loader__(source));
}

export function Entity({ name, action, entityName, fallback, ...props }) {
  const [model, setModel] = useState(null);

  useEffect(() => {
    loopar.getMeta("Viewer", action, { document: name, name: entityName }).then((meta) => {
      if (meta) setModel({ Component: _Import(meta.client_importer), meta });
    });
  }, []);

  const updateValue = (structure, Document) => {
    return structure.map((el) => {
      if (Object.keys(Document).includes(el.data?.name)) {
        const value = Document[el.data.name];

        el.data.value = value;
      }

      el.elements = updateValue(el.elements || [], Document);
      return el;
    });
  };

  useEffect(() => {
    if (model && model.meta)
      model.meta.__ENTITY__.doc_structure = JSON.stringify(updateValue(JSON.parse(model.meta.__ENTITY__.doc_structure), model.meta.__DOCUMENT__))
  }, [model])

  if (model) {
    const { Component, meta } = model;
    return <Component {...props} meta={meta} />
  }

  return fallback || <Fallback />;
}