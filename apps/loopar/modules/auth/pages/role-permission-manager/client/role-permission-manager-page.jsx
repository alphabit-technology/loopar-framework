'use strict';

import { useDocument } from '@loopar/document';
import { PageLayout } from '@loopar/page';
import { RolePermissionManager } from "./src/role-permission-manager.jsx";

export default function RolePermissionManagerPage() {
  const { Document } = useDocument();
  // `?role=` / `?user=` preselect a subject; otherwise the last one used is restored.
  const { role, user } = Document;

  return (
    <PageLayout>
      <RolePermissionManager role={role && role !== "core" ? role : undefined} user={user || undefined} />
    </PageLayout>
  );
}
