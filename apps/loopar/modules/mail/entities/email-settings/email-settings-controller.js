
'use strict';

import {BaseController, loopar} from 'loopar';

export default class EmailSettingsController extends BaseController {
    constructor(props){
        super(props);
    }

    async actionTestConnection(){
      const data = this.query;
      if(data.password == "********"){
        data.password = await loopar.db.getValue("Email Settings", "password");
      }
      const test = await loopar.mail.testConnection(data);
      if(test.success){
        return { success: true, sccessMessage: test.message };
      } else {
        return { success: false, errorMessage: test.error };
      }
    }
}