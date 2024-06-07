//import "@styles/globals.css";
import { cn } from "@/lib/utils";
import React from "react";
import { CookiesProvider } from '@services/cookie';
import { useCookies } from "@services/cookie";


interface RootLayoutProps {
  __META__: {
    workspace: string;
    meta: string;
    key: string;
    client_importer: string;
    W: string;
  };
  Workspace: React.FC<any>;
  Document: React.FC<any>;
  ENVIRONMENT: string;
  cookieManager: any;
}

const Main = ({ __META__, Workspace, Document, ENVIRONMENT, cookieManager }: RootLayoutProps) => {
  const workspace = JSON.parse(__META__.workspace);
  const meta = JSON.parse(__META__.meta);

  return (
    <main
      className={cn(
        "min-h-screen bg-background font-sans antialiased"
      )}
    >
      <div className="relative flex min-h-screen flex-col">
        <div className="flex-1">
          <Workspace
            {...workspace}
            __META__={__META__}
            documents={{
              [__META__.key]: {
                Module: Document,
                __META__,
                meta: { ...meta, key: __META__.key },
                active: true,
              },
            }}
            ENVIRONMENT={ENVIRONMENT}
          />
        </div>
      </div>
    </main>
  );
}

const App = ({ __META__, Workspace, Document, ENVIRONMENT, cookieManager }: RootLayoutProps) => {

  const [update, setUpdate] = React.useState(false);

  return (
    <>
      <CookiesProvider manager={cookieManager} updater={setUpdate}>
        <Main
          __META__={__META__}
          Workspace={Workspace}
          Document={Document}
          ENVIRONMENT={ENVIRONMENT}
          cookieManager={cookieManager}
        />
      </CookiesProvider>
    </>
  )
}

export default App;