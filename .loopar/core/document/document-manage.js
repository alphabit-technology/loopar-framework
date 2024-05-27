import { loopar } from '../loopar.js';
import { fileManage } from "../file-manage.js";

class DocumentManage {
  constructor(props) {
    Object.assign(this, props);
  }

  async getDocument(DOCTYPE, documentName, data = null, app = null) {
    const databaseData = await loopar.db.getDoc(DOCTYPE.name, documentName, ['*'], { isSingle: DOCTYPE.is_single });

    if (databaseData) {
      data = Object.assign(databaseData, data || {});
      return await this.newDocument(DOCTYPE, data, documentName, app);
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
      __IS_NEW__: !documentName
    });

    await instance.__init__();
    return instance;
  }

  async isCoreApp(document) {
    const data = await fileManage.getConfigFile("installer", loopar.makePath("apps", "loopar"));

    return (data?.Document?.documents || {})[document];
  }

  async #importDocument(doctype) {
    doctype.__APP__ ??= await this.isCoreApp(doctype.name) ? "loopar" : await loopar.db.getValue("Module", "app_name", doctype.module);
    doctype.__PATH__ = loopar.makePath("apps", doctype.__APP__, "modules", doctype.module, doctype.name);
    const documentPathFile = loopar.makePath("apps", doctype.__APP__, "modules", doctype.module, doctype.name, `${doctype.name}.js`);
    //doctype.__PATH__ = documentPathFile;

    return fileManage.importClass(documentPathFile, (e) => {
      console.log("importDocument err", e);
      loopar.throw({ code: 404, message: `Document ${doctype.name} not found` });
    });
  }
}

export const documentManage = new DocumentManage({})