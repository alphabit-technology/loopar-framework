'use strict'

import BaseController from './base-controller.js';
import { loopar } from "loopar";

export default class SingleController extends BaseController {
   constructor(props) {
      super(props);

      this.action === 'list' && this.redirect('update');
   }

  async sendAction(action) {
    const selfAction = `action${loopar.utils.Capitalize(action)}`;
    if (typeof this[selfAction] == 'function') {
      return await this[selfAction]();
    }else{
      const webApp = loopar.webApp || { menu_items: [] };
      const menu = webApp.menu_items.find(item => item.link === action.replaceAll('_', ' '));

      const document = await loopar.getDocument(menu?.page || action);
      document.parentPage = this.document;

      return await this.render(document);
    }
  }
}