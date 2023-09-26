import { loopar } from '../loopar.js';
import { fileManage } from "../file-manage.js";

class DocumentManage {
   constructor(props) {
      Object.assign(this, props);
   }

   async getDocument(DOCTYPE, documentName, data = null) {
      const database_data = await loopar.db.getDoc(DOCTYPE.name, documentName, ['*'], {isSingle: DOCTYPE.is_single});

      if (database_data) {
         data = Object.assign(database_data, data || {});
         return await this.newDocument(DOCTYPE, data, documentName);
      } else {
         loopar.throw({ code: 404, message: `${DOCTYPE.name} ${documentName} not found` });
      }
   }

   async newDocument(DOCTYPE, data = {}, documentName) {
      const DOCUMENT = await this.#importDocument(DOCTYPE);

      const instance = await new DOCUMENT({
         __DOCTYPE__: DOCTYPE,
         __DOCUMENT_NAME__: documentName,
         __DOCUMENT__: data,
         __IS_NEW__: !documentName,
         __APP__: DOCTYPE.app_name,
      });

      await instance.__init__();
      return instance;
   }

   /*async getForm(DOCTYPE, data = {}) {
      return await this.newForm(DOCTYPE, data);
   }

   async newForm(DOCTYPE, data = {}) {
      return await this.newDocument(DOCTYPE, data, null, 'Form');
   }*/

   async #appRoute(doctype) {
      const app_name = await this.#appName(doctype);
      doctype.app_name = app_name;
      return loopar.makePath("apps", app_name || "loopar");
   }

   async #appName(doctype) {
      return doctype.app_name || await loopar.db.getValue("Module", "app_name", doctype.module);
   }

   #documentName(document) {
      return loopar.utils.decamelize(document, { separator: '-' });
   }

   async #importDocument(doctype) {
      const appRoute = await this.#appRoute(doctype);
      const documentName = this.#documentName(doctype.name);
      const documentPathFile = loopar.makePath(appRoute, "modules", doctype.module, documentName, `${documentName}.js`);

      /*this.documentPathFile = await fileManage.existFile(documentPathFile) ?
         documentPathFile : './document/base-document.js';*/

      return fileManage.importClass(documentPathFile, (e) => {
         loopar.throw({ code: 404, message: `Document ${doctype.name} not found` });
      });
   }
}

export const documentManage = new DocumentManage({})