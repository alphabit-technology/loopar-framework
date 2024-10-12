//import "@styles/globals.css";
import { cn } from "@/lib/utils";
import React from "react";
import { CookiesProvider } from '@services/cookie';
import { WorkspaceProvider } from "@workspace/workspace-provider";
import { ErrorBoundary } from "@error-boundary";

interface RootLayoutProps {
  __META__: {
    __DOCUMENT__: any;
    __WORKSPACE__: any;
    //workspace: string;
    //meta: string;
    key: string;
    client_importer: string;
    //W: string;
  };
  Workspace: React.FC<any>;
  Document: React.FC<any>;
  ENVIRONMENT: string;
  cookieManager: any;
}

const Main = ({ __META__, Workspace, Document, ENVIRONMENT }: RootLayoutProps) => {
  const __WORKSPACE__ = __META__.__WORKSPACE__;

  return (
    <main
      className={cn(
        "min-h-screen bg-background font-sans antialiased"
      )}
    >
      <div className="relative flex min-h-screen flex-col">
        <div className="flex-1">
          <WorkspaceProvider
            __META__={__META__}
            ENVIRONMENT={ENVIRONMENT}
            //workspace={__WORKSPACE__.name}
            Documents={{
              [__META__.key]: {
                Module: Document,
                __DOCUMENT__: __META__.__DOCUMENT__,
                //meta: { ...meta, key: __META__.key },
                active: true,
              }
            }}
          >
            <Workspace
              {...__WORKSPACE__}
              __META__={__META__}
            />
          </WorkspaceProvider>
        </div>
      </div>
    </main>
  );
}

const App = ({ __META__, Workspace, Document, ENVIRONMENT, cookieManager }: RootLayoutProps) => {
  const [update, setUpdate] = React.useState(false);

  return (
    <>
      <ErrorBoundary>
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
        <CookiesProvider manager={cookieManager} updater={setUpdate}>
          <Main
            __META__={__META__}
            Workspace={Workspace}
            Document={Document}
            ENVIRONMENT={ENVIRONMENT}
            cookieManager={cookieManager}
          />
        </CookiesProvider>
      </ErrorBoundary>
    </>
  )
}

export default App;