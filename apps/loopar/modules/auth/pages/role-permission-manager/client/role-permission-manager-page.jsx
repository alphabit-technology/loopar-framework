'use strict';

import PageContext from '@context/page-context';
import { RolePermissionManager } from "./src/role-permission-manager.jsx";

export default class RolePermissionManagerPage extends PageContext {
  constructor(props) { super(props); }
  render() {
    const Document = this.props.Document || {};
    const {role, permissions } = Document;
    return super.render([
      <RolePermissionManager initialRole={role} permissions={permissions} />
    ]);
  }
}
