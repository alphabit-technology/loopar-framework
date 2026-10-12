
'use strict';

import {BaseController, loopar} from 'loopar';

export default class EmailSettingsController extends BaseController {
    constructor(props){
        super(props);
    }

    async actionTestConnection(){
      const data = this.query;
      if(data.password == "********"){
        // Stored encrypted: read through the document so it gets decrypted.
        data.password = (await loopar.getDocument("Email Settings")).password;
      }
      const test = await loopar.mail.testConnection(data);
      if (!test.success) {
        // SMTP server rejected/unreachable: upstream failure, not a request bug.
        loopar.throw({ status: 502, code: 'SMTP_CONNECTION_FAILED', title: 'Connection failed', message: test.error });
      }
      return await this.success('Connection successful');
    }
}