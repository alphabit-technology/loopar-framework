/*import React, { useState, useEffect, lazy, Suspense } from 'react';
import * as workspaces from '@loopar/gui/workspace';
import { ClipLoader } from 'react-spinners'; // Importa el componente de spinner
const exporter = 'loopar-home-view';
const initialData = JSON.parse(global.__INITIAL_DATA__);
//console.log("XXXXXXXXX Client Impo", initialData.client_importer)
//const Module = lazy(() => import(`@loopar-home-view`));

//const clientImporter = initialData.client_importer;
//console.log("XXXXXXXXX Client Impo", initialData )
const Module = lazy(() => global.import(`@${exporter}.jsx`));
//const Module = lazy(() => import(`./${initialData.client_importer}1`));

function kebabToPascal(kebabString) {
  return kebabString
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
}

function App() {
  const [documents, setDocuments] = useState({});

  console.log("XXXXXXXXX Client Impo", initialData.W)

  const workspace = JSON.parse(initialData.workspace);
  const Workspace = workspaces[kebabToPascal(initialData.W + '-workspace')];



  //console.log("Lazy", document)
  /*
  documents: {
      "!{key}": {
          module: app_imported,
          meta: {...meta, key: '#{key}'},
          active: true
      }
  }
  */

  /*useEffect(() => {
    console.log("************USE EFFECT", initialData)
    const key = initialData.key
    const app_imported = initialData.app_imported
    const meta = {
      ...workspace,
      key: key
    }

    import(`@loopar/${initialData.client_importer}.jsx`).then((app_imported) => {
      console.log("****************************app_imported", app_imported)
    })
    setDocuments({
      [key]: {
        module: app_imported,
        meta: meta,
        active: true
      }
    })
  })

  return (
    <Suspense fallback={<ClipLoader size={35} color={'#123abc'} />}>
      <Workspace
        meta={workspace}
        documents={{
          [initialData.key]: {
            Module: Module,
            meta: {
              ...workspace,
              key: initialData.key
            },
            active: true
          }
        }}
      ></Workspace>
    </Suspense>
  );
}

export default App;*/
