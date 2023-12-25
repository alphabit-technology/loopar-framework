import React from 'react';
import * as workspaces from '#workspace';
import loopar from '#loopar';

export default function App({ __META__, Document}) {
  const workspace = JSON.parse(__META__.workspace);
  const Workspace = workspaces[loopar.utils.kebabToPascal(__META__.W + '-workspace')];
  const meta = JSON.parse(__META__.meta);

  return (
    <>
      <Workspace
        meta={workspace}
        documents={{
          [__META__.key]: {
            Module: Document.default,
            meta: { ...meta, key: __META__.key },
            active: true
          }
        }}
      ></Workspace>
    </>
  );
}
