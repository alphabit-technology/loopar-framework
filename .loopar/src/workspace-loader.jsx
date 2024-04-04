const Workspaces = {};

export async function WorkspaceLoader(workspace) {
  return new Promise((resolve) => {
    if (Workspaces[workspace]) {
      return resolve(Workspaces[workspace]);
    } else {
      import(`./workspace/${workspace}/${workspace}-workspace.jsx`).then((Workspace) => {
        Workspaces[workspace] = Workspace;
        return resolve(Workspace);
      });
    }
  });
}
