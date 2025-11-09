'use strict'

import BaseController from './base-controller.js';
import { loopar } from "loopar";

export default class SingleController extends BaseController {
  constructor(props) {
    super(props);

    this.action === 'list' && this.redirect('update');
  }

  async getParent(){
    return await loopar.db.getValue('Menu Item', "page", {page: this.document});
  }

  async sendAction(action) {
    await this.beforeAction();
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
    const menu = webApp.menu_items.find(item => [item.page, item.link].includes(action));

    const document = await loopar.getDocument(menu?.page || action);
    /* document.__ENTITY__ = {
      name: document.__ENTITY__?.name,
      doc_structure: document.__ENTITY__?.doc_structure || "[{}]",
    } */
    //const parent = await this.getParent();
    //document.activeParentMenu = parent;
    //document.__DOCUMENT_TITLE__ = menu?.link || this.document;

    return await this.render({
      //...await document.__meta__(),
      Entity: {
        name: document.__ENTITY__?.name,
        background_image: document.__ENTITY__?.background_image,
        doc_structure: document.__ENTITY__?.doc_structure || "[{}]",
      },
      activeParentMenu: await this.getParent(),
      __DOCUMENT_TITLE__: menu?.link || this.document,
    });
  }
}