import { loopar } from '../loopar.js';
import { fileManage } from "../file-manage.js";

class DocumentManage {
  constructor(props) {
    Object.assign(this, props);
  }

  async getDocument(ENTITY, name, data = null) {
    const databaseData = await loopar.db.getDoc(ENTITY.name, name, ['*'], { isSingle: ENTITY.is_single });

    if (databaseData) {
      data = Object.assign(databaseData, data || {});
      return await this.newDocument(ENTITY, data, name);
    } else {
      loopar.throw({ code: 404, message: `${ENTITY.name} ${name}: not found` });
    }
  }

  async newDocument(ENTITY, data = {}, name) {
    const DOCUMENT = await this.#importDocument(ENTITY);

    const instance = await new DOCUMENT({
      __ENTITY__: ENTITY,
      __DOCUMENT_NAME__: name,
      __DOCUMENT__: data,
      __IS_NEW__: !name
    });

    await instance.__init__();
    return instance;
  }

  async isCoreApp(document) {
    const data = await fileManage.getConfigFile("installer", loopar.makePath("apps", "loopar"));

    return (data?.Entity?.documents || {})[document];
  }

  async #importDocument(entity) {
    const ref = loopar.getRef(entity.name);
    const documentPathFile = loopar.makePath(ref.entityRoot, `${entity.name}.js`);

    return fileManage.importClass(documentPathFile, (e) => {
      console.log("importDocument err", e);
      loopar.throw({ code: 404, message: `Document ${entity.name} not found` });
    });
  }
}

export const documentManage = new DocumentManage({})