import { WorkspaceLoader } from "@loopar/workspace-loader";
import { MetaComponentsLoader } from "@loopar/components-loader";
import React, { useEffect, lazy, useState } from "react";

import { loopar } from "loopar";

import {LoaderCircleIcon} from "lucide-react";

const Fallback = () => (
  <div className="flex flex-row justify-center items-center h-full">
    <LoaderCircleIcon className="animate-spin" size={150} />
  </div>
);

const appSources = Object.entries(import.meta.glob([
  '/apps/**/modules/**/**/**/client/*.jsx',
  '/.loopar/apps/core/modules/**/**/**/client/*.jsx',
  '/.loopar/src/context/*.jsx',
])).reduce((acc, [path, module]) => {
  acc['app/' + path.split('/').pop().replace('.jsx', '')] = module;
  return acc;
}, {});

export async function AppSourceLoader(source) {
  if (!source) return null;

  try {
    const moduleImport = appSources[source.client] || appSources[source.context];
    return moduleImport ? await moduleImport() : null;
  } catch (error) {
    console.error(`Error importing module: ${source.client}`, error);
    throw new Error(`Error importing module: ${source.client}`);
  }
}

export const Loader = (__META__, ENVIRONMENT) => {
  return new Promise((resolve) => {
    WorkspaceLoader(__META__.__WORKSPACE__.name).then(Workspace => {
      __META__.__DOCUMENT__ ? AppSourceLoader(__META__.__DOCUMENT__.client_importer).then(Document => {
          MetaComponentsLoader(__META__, ENVIRONMENT).then(() => {
            resolve({ Workspace: Workspace.default, Document: Document.default });
          })
        }) : resolve({ Workspace: Workspace.default, Document: null});
    });
  });
}

async function __loader__(source ) {
  return new Promise((resolve) => {
    AppSourceLoader(source).then(module => {
      resolve(module);
    })
  });
}

function _Import(source) {
  return lazy(() => __loader__(source));
}

export function Entity({ name, action, fallback, ...props }) {
  const [model, setModel] = useState(null);

  useEffect(() => {
    loopar.getMeta(name, action).then((meta) => {
      if (meta) setModel({ Component: _Import(meta.client_importer), meta } );
    });
  }, []);
  
  if (model) {
    const { Component, meta } = model;
    return <Component {...props} meta={meta} />
  }

  return fallback || <Fallback />;
}