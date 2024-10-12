import { WorkspaceLoader } from "@loopar/workspace-loader";
import { MetaComponentsLoader } from "@loopar/components-loader";
import { AppSourceLoader } from "@/app-source-loader";

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