
'use strict';

import FormContext from '@context/form-context';
import { RolePermissionManager } from '../../../pages/role-permission-manager/client/src/role-permission-manager';

export default class UserForm extends FormContext {
  constructor(props){
    super(props);
  }

  render(){
    const data = this.props.Document || {};
    return super.render(null,
      {
        "user_roles": () => {
          return <RolePermissionManager manager="user" user={data.name} />
        }
      }
    )
  }
}