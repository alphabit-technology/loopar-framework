'use strict'

import BaseController from './base-controller.js';
import { loopar } from "loopar";

export default class SingleController extends BaseController {
  static inheritedActions = ['view', 'update', 'print'];
  
  constructor(props) {
    super(props);

    this.action === 'list' && this.redirect('update');
  }

  async getParent(){
    return await loopar.db.getValue('Menu Item', "page", {page: this.document});
  }

  async sendAction(action) {
    await this.beforeAction();
    const selfAction = `${loopar.utils.Capitalize(action)}`;
    if (typeof this[`publicAction${selfAction}`] == 'function') {
      return await this[`publicAction${selfAction}`]();
    }else if(typeof this[`action${selfAction}`] == 'function'){
      return await this[`action${selfAction}`]();
    }else{
      return await this.sendDocument(action);
    }
  }

  async actionView() {
    return await this.sendDocument();
  }
  
  async sendDocument(action=this.document, data={}) {
    const webApp = loopar.webApp || { menu_items: [] };
    const menu = webApp.menu_items.find(item => [item.page, item.link].includes(action));

    const document = await loopar.getDocument(menu?.page || action);

    return await this.render({
      Entity: {
        name: document.__ENTITY__?.name,
        background_image: document.__ENTITY__?.background_image,
        doc_structure: document.__ENTITY__?.doc_structure || "[{}]",
      },
      activeParentMenu: await this.getParent(),
      __DOCUMENT_TITLE__: menu?.link || this.document,
      ...data,
    });
  }
}