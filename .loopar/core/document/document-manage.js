import { loopar } from 'loopar';
import { fileManage } from "../file-manage.js";
import { marked } from 'marked';

class DocumentManage {
  constructor(props) {
    Object.assign(this, props);
  }

  async getDocument(document, name, data = null, ifNotFound = 'throw') {
    const ENTITY = this.#GET_ENTITY(document);
    const databaseData = await loopar.db.getDoc(ENTITY, name, ENTITY.__REF__.__FIELDS__);

    if (databaseData) {
      data = Object.assign(databaseData, data || {});
      return await this.newDocument(document, data, name);
    } else {
      if (ifNotFound === 'new') {
        return await this.newDocument(document, data, name);
      }

      if (ifNotFound === 'throw') {
        loopar.throw({ code: 404, message: `${ENTITY.name} ${name}: not found` });
      }

      return ifNotFound;
    }
  }

  async newDocument(document, data = {}, name) {
    const ENTITY = this.#GET_ENTITY(document);
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

  #GET_ENTITY(document) {
    const throwError = (type) => {
      loopar.throw({
        code: 404,
        message: `${(type || "Entity")}: ${document} not found`,
      });
    }

    let ENTITY = null;
    const ref = loopar.getRef(document);
    if (!ref) return throwError();

    const entityName = ref.__ENTITY__;

    /**Testing get fileRef only */
    ENTITY = fileManage.getConfigFile(document, ref.__ROOT__);

    if (!ENTITY) return throwError(entityName);

    ENTITY.is_single ??= ref.is_single;
    ENTITY.__REF__ = ref;
    const doc_structure = loopar.utils.isJSON(ENTITY.doc_structure) ? JSON.parse(ENTITY.doc_structure) : typeof ENTITY.doc_structure === 'object' ? ENTITY.doc_structure : [];

    //ENTITY.doc_structure = JSON.stringify(this.parseDocStructure(doc_structure));

    return ENTITY;
  }

  parseDocStructure(doc_structure) {
    return doc_structure.map(field => {
      //field.data.value = field.element === MARKDOWN ? marked.parse(field.data.value) : field.data.value;

      if (field.elements) {
        field.elements = this.parseDocStructure(field.elements);
      }

      return field;
    });
  }


  async #importDocument(ENTITY) {
    const documentPathFile = loopar.makePath(ENTITY.__REF__.__ROOT__, `${ENTITY.name}.js`);

    return fileManage.importClass(documentPathFile, (e) => {
      console.log("importDocument err", e);
      loopar.throw({ code: 404, message: `Document ${ENTITY.name} not found` });
    });
  }
}

export const documentManage = new DocumentManage({})