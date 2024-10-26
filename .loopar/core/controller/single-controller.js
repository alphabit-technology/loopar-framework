'use strict'

import BaseController from './base-controller.js';
import { loopar } from "loopar";

export default class SingleController extends BaseController {
  constructor(props) {
    super(props);

    this.action === 'list' && this.redirect('update');
  }

  async getParent(){
    return await loopar.db.getValue('Menu Item', "page", {
      "=": {page: this.document}
    });
  }

  async sendAction(action) {
    const selfAction = `action${loopar.utils.Capitalize(action)}`;
    if (typeof this[selfAction] == 'function') {
      return await this[selfAction]();
    }else{
      return await this.sendDocument(action);
    }
  }

  async actionView() {
    return await this.sendDocument();
  }
  
  async sendDocument(action=this.document) {
    const webApp = loopar.webApp || { menu_items: [] };
    const menu = webApp.menu_items.find(item => item.link === action.replaceAll('_', ' '));

    const document = await loopar.getDocument(menu?.page || action);
    const parent = await this.getParent();
    document.activeParentMenu = parent;

    return await this.render(document);
  }
}