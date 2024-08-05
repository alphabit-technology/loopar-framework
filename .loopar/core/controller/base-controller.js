'use strict'

import { loopar } from "../loopar.js";
import CoreController from './core-controller.js';

export default class BaseController extends CoreController {
  default_action = 'list';
  hasSidebar = true;

  constructor(props) {
    super(props);
  }

  async actionList() {
    if (this.hasData()) {
      await loopar.session.set(this.document + '_q', this.data.q || {});
      await loopar.session.set(this.document + '_page', this.data.page || 1);
    }

    const data = { ...loopar.session.get(this.document + '_q') || {} };

    const list = await loopar.getList(this.document, { q: (data && Object.keys(data).length > 0) ? data : null });
    return this.render(list);
  }

  async actionCreate() {
    const document = await loopar.newDocument(this.document, this.data);

    if (document.__DOCTYPE__.is_single) {
      return loopar.throw({
        code: 404,
        message: "This document is single, you can't create new"
      });
    }

    if (this.hasData()) {
      await document.save();
      this.redirect('update?documentName=' + document.name);
    } else {
      Object.assign(this.response, await document.__data__());
      return this.render(this.response);
    }
  }

  async actionUpdate(document) {
    document ??= await loopar.getDocument(this.document, this.documentName, this.hasData() ? this.data : null);

    if (this.hasData()) {
      const isSingle = document.__DOCTYPE__.is_single;
      await document.save();
      return await this.success(
        `${document.__DOCTYPE__.name } ${isSingle ? '' : document.name} saved successfully...`, { documentName: document.name }
      );
    } else {
      return await this.render({ ...await document.__data__(), ...this.response || {} });
    }
  }

  async actionView() {
    const document = await loopar.getDocument(this.document, this.documentName);

    if (document.__DOCTYPE__.side_menu) {
      //const menuId = await loopar.db.getValue('Menu Item', 'name', { "=": {page: document.__DOCTYPE__.name}});

      //console.log(["Menu Id", menuId])
      //document.side_menu = document.__DOCTYPE__.side_menu;
      //document.side_menu_items = await loopar.db.getList('Menu Item', ["page", "link", "parent_menu"], {"=": {parent_menu: menuId}});
    }

    return await this.render(document);
  }

  async actionDelete() {
    const document = await loopar.getDocument(this.document, this.documentName);
    const result = await document.delete();

    this.res.send(result);
  }

  async actionBulkDelete() {
    const documentNames = loopar.utils.isJSON(this.documentNames) ? JSON.parse(this.documentNames) : [];

    if (Array.isArray(documentNames)) {
      for (const documentName of documentNames) {
        const document = await loopar.getDocument(this.document, documentName);
        await document.delete();
      }
    }

    return this.success(`Documents ${documentNames.join(', ')} deleted successfully`, { documentName: documentNames.join(', ') });
  }
}