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

    let pageDocName;
    let detailSlug = null;

    if (menu) {
      pageDocName = menu.page;
    } else if (action === this.document) {
      pageDocName = this.document;
    } else {
      pageDocName = this.document;
      detailSlug = action;
    }

    const requestContext = {
      slug: detailSlug,
      app: webApp?.name || null,
      query: this.query || {},
    };

    const document = await loopar.getDocument(pageDocName, undefined, null, { requestContext });

    // If the URL carries a slug but no COLLECTION on this page claimed it
    // (parseDocStructure would have set _anyDetailMatched when one did),
    // the URL is bogus relative to this page — surface a real 404 instead
    // of rendering the listings silently.
    if (detailSlug && !requestContext._anyDetailMatched) {
      return loopar.throw({
        code: 404,
        message: `Page not found: ${this.document}/${detailSlug}`,
      });
    }

    return await this.render({
      Entity: {
        name: document.__ENTITY__?.name,
        background_image: document.__ENTITY__?.background_image,
        doc_structure: document.__ENTITY__?.doc_structure || "[{}]",
      },
      activeParentMenu: await this.getParent(),
      __DOCUMENT_TITLE__: menu?.link || this.document,
      ...(detailSlug? { __DETAIL_SLUG__: detailSlug } : {}),
      ...data,
    });
  }
}