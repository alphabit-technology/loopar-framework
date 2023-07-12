import {loopar} from '../loopar.js';
import path from 'path';
import {file_manage} from "../file-manage.js";
import {decamelize} from "../helper.js";

class DocumentManage {
   constructor(props) {
      Object.assign(this, props);
   }

   async get_document(DOCTYPE, document_name, data = null) {
      const database_data = await loopar.db.get_doc(DOCTYPE.name, document_name, ['*'], DOCTYPE.is_single);

      if (database_data) {
         data = Object.assign(database_data, data || {});
         return await this.new_document(DOCTYPE, data, document_name);
      } else {
         loopar.throw({code: 404, message: `Document ${document_name} not found`});
      }
   }

   async new_document(DOCTYPE, data = {}, document_name = null, type = 'Document') {
      const DOCUMENT = await this.#import_document(DOCTYPE, type);

      return new DOCUMENT.default({
         __DOCTYPE__: DOCTYPE,
         __DOCUMENT_NAME__: document_name,
         __DOCUMENT__: data,
         __IS_NEW__: !document_name,
      });
   }

   async get_form(DOCTYPE, data = {}) {
      return await this.new_form(DOCTYPE, data);
   }

   async new_form(DOCTYPE, data = {}) {
      return await this.new_document(DOCTYPE, data, null, 'Form');
   }

   async #app_route(doctype) {
      const app_name = await this.#app_name(doctype);
      doctype.app_name = app_name;
      return path.join("apps", app_name || "loopar");
   }

   async #app_name(doctype) {
      return doctype.app_name || await loopar.db.get_value("Module", "app_name", doctype.module);
   }

   #document_name(document) {
      return decamelize(document.replace(/\s/g, ''), {separator: '-'});
   }

   async #import_document(doctype, type = 'Document') {
      const app_route = await this.#app_route(doctype);
      const document_name = this.#document_name(doctype.name);
      const module_path = path.join(app_route, "modules", doctype.module);
      const document_path = path.join(module_path, document_name);
      const document_path_file = path.join(document_path, `${document_name}.js`).replaceAll(/\s+/g, '-').toLowerCase();

      this.document_path_file = await file_manage.exist_file(document_path_file) ?
         this.document_path_file :
         type === 'Form' ? './document/base-form.js' : './document/base-document.js';

      return file_manage.import_file(document_path_file, () => {
         loopar.throw({code: 404, message: `Document ${doctype.name} not found`});
      });
   }
}

export const document_manage = new DocumentManage({})