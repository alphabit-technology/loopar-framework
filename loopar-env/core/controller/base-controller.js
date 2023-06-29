'use strict'

import {loopar} from "../loopar.js";
import CoreController from './core-controller.js';

export default class BaseController extends CoreController {
   default_action = 'list';
   has_sidebar = true;

   constructor(props) {
      super(props);
   }

   async action_list() {
      
      if(this.has_data()) {
         await loopar.session.set(this.document + '_q', this.data.q || {});
         await loopar.session.set(this.document + '_page', this.data.page || 1);
      }
      const data = {...loopar.session.get(this.document + '_q') || {}};

      const list = await loopar.get_list(this.document, {q: (data && Object.keys(data).length > 0) ? data : null});
      return this.render(list);
   }

   async action_create() {
      const document = await loopar.new_document(this.document, this.data);

      if (this.has_data()) {
         await document.save();
         this.redirect('update?document_name=' + document.name);
      } else {
         Object.assign(this.response, await document.__data__());
         return this.render(this.response);
      }
   }

   async action_update() {
      const document = await loopar.get_document(this.document, this.document_name, this.has_data() ? this.data : null);

      if (this.has_data()) {
         await document.save();
         return await this.success(`Document ${document.name} saved successfully`, {document_name: document.name});
      } else {
         return this.render({...await document.__data__(), ...this.response || {}});
      }
   }

   async action_view() {
      const document = await loopar.get_document(this.document, this.document_name);

      return this.render(document);
   }

   async action_delete() {
      const document = await loopar.get_document(this.document, this.document_name);
      const result = await document.delete();

      this.res.send(result);
   }
}