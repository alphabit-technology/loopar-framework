import "@styles/globals.css";
import { cn } from "@/lib/utils";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import React, { useEffect } from "react";

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
}

const App = ({ __META__, Workspace, Document, ENVIRONMENT }: RootLayoutProps) => {
  const workspace = JSON.parse(__META__.workspace);
  const meta = JSON.parse(__META__.meta);

  useEffect(() => {
    if (ENVIRONMENT === "development") {
      console.log("🚀 Development Mode");
    }
  }, []);

  return (
    <>
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
              ENVIROMENT={ENVIRONMENT}
            />
          </div>
        </div>
        <TailwindIndicator />
      </main>
    </>
  )
}

export default App;