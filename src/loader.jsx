import { WorkspaceLoader } from "@loopar/workspace-loader";
import { MetaComponentsLoader } from "@loopar/components-loader";
import { AppSourceLoader } from "@/app-source-loader";

export const Loader = (__META__, ENVIRONMENT) => {
  return new Promise((resolve) => {
    WorkspaceLoader(__META__.W).then(Workspace => {
      AppSourceLoader(__META__.client_importer).then(Document => {
        MetaComponentsLoader(__META__, ENVIRONMENT).then(() => {
          resolve({ Workspace: Workspace.default, Document: Document.default });
        });
      });
    });
  });
}