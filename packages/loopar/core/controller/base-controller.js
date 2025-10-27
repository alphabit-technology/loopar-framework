'use strict'

import { loopar } from "loopar";
import CoreController from './core-controller.js';

export default class BaseController extends CoreController {
  defaultAction = 'list';
  hasSidebar = true;

  constructor(props) {
    super(props);
  }

  async actionList() {
    if (this.hasData()) {
      await loopar.session.set(this.document + '_q', this.data.q || {});
      await loopar.session.set(this.document + '_page', this.data.page || 1);
    }

    const data = Object.entries({ ...loopar.session.get(this.document + '_q') || {} }).reduce((acc, [key, value]) => {
      if (value && (value.toString()).length > 0 && value !== 0) {
        acc[key] = `${value}`;
      }
      return acc;
    }, {});

    const list = await loopar.getList(this.document, { data, q: (data && Object.keys(data).length > 0) ? data : null });

    if(this.preloaded == 'true') {
      return {
        instance: this.getInstance(),
        rows: list.rows,
        pagination: list.pagination
      }
    }

    return await this.render(list);
  }

  async actionCreate() {
    const document = await loopar.newDocument(this.document, this.data);

    if (document.__ENTITY__.is_single) {
      return loopar.throw({
        code: 404,
        message: "This document is single, you can't create new"
      });
    }

    if (this.hasData()) {
      await document.save();
      return this.redirect('update?name=' + document.name);
    } else {
      if(this.preloaded == 'true') {
        return await document.values();
      }
      
      Object.assign(this.response, await document.__meta__());
      return await this.render(this.response);
    }
  }

  async actionUpdate(document) {
    document ??= await loopar.getDocument(this.document, this.name, this.hasData() ? this.data : null);

    if (this.hasData()) {
      const Entity = document.__ENTITY__;
      const isSingle = Entity.is_single;
      await document.save();

      return await this.success(
        `${(Entity.name === "Entity") ? document.type || "Entity" : (isSingle ? "" : Entity.name)} ${isSingle ? Entity.name : document.name} saved successfully`, { name: document.name }
      );
    } else {
      if(this.preloaded == 'true') {
        return {
          instance: this.getInstance(),
          data: await document.values()
        }
      }
      return await this.render({ ...await document.__meta__(), ...this.response || {} });
    }
  }

  async actionView() {
    const document = await loopar.getDocument(this.document, this.name);
    return await this.render(document);
  }

  async actionDelete() {
    const document = await loopar.getDocument(this.document, this.name);
    await document.delete();

    return this.redirect('list');
  }

  async actionBulkDelete() {
    const names = loopar.utils.isJSON(this.names) ? JSON.parse(this.names) : [];

    if (Array.isArray(names)) {
      for (const name of names) {
        const document = await loopar.getDocument(this.document, name);
        await document.delete();
      }
    }

    return this.success(`Documents ${names.join(', ')} deleted successfully`, { name: names.join(', ') });
  }
}