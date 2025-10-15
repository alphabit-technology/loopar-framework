import { documentManage } from '../document/document-manage.js';
import { loopar } from '../loopar.js';
import { Console } from './console.js';

export class Document extends Console {
  /**
   * 
   * @param {*} document DocumentType name
   * @param {*} name Document name
   * @param {*} data
   * @param {*} ifNotFound
   * @returns 
   */
  async getDocument(document, name, data = null, { ifNotFound = 'throw', parse = false } = {}) {
    return await documentManage.getDocument(document, name, data, { ifNotFound, parse });
  }

  /**
   * 
   * @param {*} document 
   * @param {*} data 
   * @returns 
   */
  async newDocument(document, data = {}) {
    return await documentManage.newDocument(document, data);
  }

  async deleteDocument(document, name, { sofDelete = true, force = false, ifNotFound = null, updateHistory = true } = {}) {
    const Doc = await this.getDocument(document, name);
    await Doc.delete({ sofDelete, force, updateHistory });
  }

  async getList(document, { data = {}, fields = null, filters = {}, orderBy = 'name', limit = 10, offset = 0, q = null, rowsOnly = false } = {}, ifNotFound = null) {
    const doc = await this.newDocument(document, data);
    return await doc.getList({ fields, filters, orderBy, limit, offset, page: parseInt(loopar.session.get(document + "_page", 1), rowsOnly), q });
  }

  async getListToForm(document, { data = {}, fields = null, filters = {}, orderBy = 'name', limit = 10, offset = 0, q = null, rowsOnly = false } = {}, ifNotFound = null) {
    const doc = await this.newDocument(document, data);
    return await doc.getListToForm({ fields, filters, orderBy, limit, offset, page: parseInt(loopar.session.get(document + "_page", 1), rowsOnly), q });
  }
}