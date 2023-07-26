import { loopar } from '../loopar.js';
import path from 'path';
import { fileManage } from "../file-manage.js";
import { decamelize } from "../helper.js";

class DocumentManage {
   constructor(props) {
      Object.assign(this, props);
   }

   async getDocument(DOCTYPE, documentName, data = null) {
      const database_data = await loopar.db.getDoc(DOCTYPE.name, documentName, ['*'], DOCTYPE.is_single);

      if (database_data) {
         data = Object.assign(database_data, data || {});
         return await this.newDocument(DOCTYPE, data, documentName);
      } else {
         loopar.throw({ code: 404, message: `Document ${documentName} not found` });
      }
   }

   async newDocument(DOCTYPE, data = {}, documentName = null, type = 'Document') {
      const DOCUMENT = await this.#importDocument(DOCTYPE, type);

      return new DOCUMENT.default({
         __DOCTYPE__: DOCTYPE,
         __documentName__: documentName,
         __DOCUMENT__: data,
         __IS_NEW__: !documentName,
      });
   }

   async getForm(DOCTYPE, data = {}) {
      return await this.newForm(DOCTYPE, data);
   }

   async newForm(DOCTYPE, data = {}) {
      return await this.newDocument(DOCTYPE, data, null, 'Form');
   }

   async #appRoute(doctype) {
      const app_name = await this.#appName(doctype);
      doctype.app_name = app_name;
      return loopar.makePath("apps", app_name || "loopar");
   }

   async #appName(doctype) {
      return doctype.app_name || await loopar.db.getValue("Module", "app_name", doctype.module);
   }

   #documentName(document) {
      return decamelize(document.replace(/\s/g, ''), { separator: '-' });
   }

   async #importDocument(doctype, type = 'Document') {
      const appRoute = await this.#appRoute(doctype);
      const documentName = this.#documentName(doctype.name);
      const documentPathFile = loopar.makePath(appRoute, "modules", doctype.module, documentName, `${documentName}.js`);

      this.documentPathFile = await fileManage.existFile(documentPathFile) ?
         documentPathFile : './document/base-document.js';

      return fileManage.importFile(documentPathFile, () => {
         loopar.throw({ code: 404, message: `Document ${doctype.name} not found` });
      });
   }
}

export const documentManage = new DocumentManage({})