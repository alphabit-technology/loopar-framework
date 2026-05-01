
'use strict';

import {BaseDocument, loopar} from 'loopar';

export default class EmailSettings extends BaseDocument {
    constructor(props){
        super(props);
    }

    async testConnection() {
      //const { emailService } = await import('loopar/core/email.js');
      loopar.mail.reset();
      return await loopar.mail.testConnection();
    }
  
    async afterSave() {
      loopar.mail.reset();
    }
}