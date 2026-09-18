'use strict';

import { useDocument } from '@loopar/document';
import { FormLayout } from '@loopar/form';
import { RolePermissionManager } from '../../../pages/role-permission-manager/client/src/role-permission-manager';

export default function RoleForm() {
  const { Document } = useDocument();

  return (
    <FormLayout
      slots={{
        permissions: () => <RolePermissionManager manager="role" role={Document.name} />,
      }}
    />
  );
}
