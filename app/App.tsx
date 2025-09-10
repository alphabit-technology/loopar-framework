import { cn } from "@cn/lib/utils";
import React, {useEffect} from "react";
import {CookiesProvider} from '@services/cookie';
import { WorkspaceProvider } from "@workspace/workspace-provider";
import 'vite/modulepreload-polyfill';

import { useNavigate } from 'react-router';

interface RootLayoutProps {
  __META__: {
    __DOCUMENT__: any;
    __WORKSPACE__: any;
    key: string;
    client_importer: string;
  };
  Workspace: React.FC<any>;
  Document: React.FC<any>;
  ENVIRONMENT: string;
  cookieManager: any;
}

const Main = ({ __META__, Workspace, Document, ENVIRONMENT }: RootLayoutProps) => {
  const __WORKSPACE__ = __META__.__WORKSPACE__;
  const __DOCUMENT__ = __META__.__DOCUMENT__;

  const navigate = useNavigate();
  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      const isDesk = path.startsWith('/desk');
      const isAuth = !!localStorage.getItem('token');
      if (isDesk && !isAuth) {
        navigate('/auth/login', { replace: true });
      }
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [navigate]);

  return (
    <main
      className={cn(
        "h-full font-sans antialiased"
      )}
    >
      <div className="relative flex flex-col">
        <div className="flex-1" translate="yes">
          <WorkspaceProvider
            __META__={__META__}
            ENVIRONMENT={ENVIRONMENT}
            Documents={{
              [__DOCUMENT__.key]: {
                key: __DOCUMENT__.key,
                Module: Document,
                __DOCUMENT__: __DOCUMENT__,
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
  const [, setUpdate] = React.useState(false);

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