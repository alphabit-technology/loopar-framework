'use strict';

import { useDocument } from '@loopar/document';
import { FormLayout } from '@loopar/form';
import { RolePermissionManager } from '../../../pages/role-permission-manager/client/src/role-permission-manager';

export default function UserForm() {
  const { Document } = useDocument();

  return (
    <FormLayout
      slots={{
        user_roles: () => <RolePermissionManager manager="user" user={Document.name} />,
      }}
    />
  );
}
