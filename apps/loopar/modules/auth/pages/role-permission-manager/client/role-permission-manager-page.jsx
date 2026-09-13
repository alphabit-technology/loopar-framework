'use strict';

import PageContext from '@context/page-context';
import { RolePermissionManager } from "./src/role-permission-manager.jsx";

export default class RolePermissionManagerPage extends PageContext {
  constructor(props) { super(props); }
  render() {
    const Document = this.props.Document || {};
    // `?role=` / `?user=` preselect a subject; otherwise the last one used is restored.
    const { role, user } = Document;
    return super.render([
      <RolePermissionManager role={role && role !== "core" ? role : undefined} user={user || undefined} />
    ]);
  }
}
