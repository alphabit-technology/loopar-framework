
'use strict';

import {BaseController, loopar} from 'loopar';

export default class ContactMessageController extends BaseController {
  static publicActions = ['submit'];

  async publicActionSubmit() {
    const contact = await loopar.newDocument('Contact Message', this.data);
    await contact.send();

    return await this.success("Message sent successfully")
  }
}