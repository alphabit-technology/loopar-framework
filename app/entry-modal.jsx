import App from "./App.tsx";
import { ModalWorkspace } from "@workspace/modal/modal-workspace";
import { getWorkspaceName } from "@global/router-utils";

/**
 * A modal renders a mini-workspace. It CANNOT nest a second <Router> (react
 * router forbids it), so it navigates via local in-memory state instead: the
 * secondary WorkspaceProvider drives its own `pathname` and its links are
 * intercepted by context (see Link). `primary={false}` keeps it from touching
 * the singleton / socket / session. The workspace is derived from the initial
 * path so hosted docs route as their real workspace (e.g. `auth`), not "modal".
 */
export function EntryModal({ __META__, View, initialPath, onClose }){
  const path = initialPath || (typeof window !== "undefined" ? window.location.pathname : "/");
  const workspace = getWorkspaceName(path);

  return (
    <App
      __META__={{
        ...(__META__ || {}),
        name: workspace,
        components: {Workspace: ModalWorkspace, View},
        environment: "client",
        services: {}
      }}
      permissions={__META__?.permissions}
      pathname={path}
      primary={false}
      onClose={onClose}
    />
  );
}
