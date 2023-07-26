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

   async actionUpdate() {
      const document = await loopar.getDocument(this.document, this.documentName, this.hasData() ? this.data : null);

      if (this.hasData()) {
         await document.save();
         return await this.success(`Document ${document.name} saved successfully`, { documentName: document.name });
      } else {
         return this.render({ ...await document.__data__(), ...this.response || {} });
      }
   }

   async actionView() {
      const document = await loopar.getDocument(this.document, this.documentName);

      return this.render(document);
   }

   async actionDelete() {
      const document = await loopar.getDocument(this.document, this.documentName);
      const result = await document.delete();

      this.res.send(result);
   }
}