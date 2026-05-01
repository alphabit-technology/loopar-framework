
'use strict';

import { BaseDocument, loopar } from 'loopar';

export default class DocumentHistory extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async delete() {
    loopar.throw("You can't delete History Document");
  }

  get docRef() {
    return { "=": { id: this.document_id } };
  }

  async restore() {
    if (await loopar.db.getValue(this.document, "__document_status__", this.docRef, { includeDeleted: true }) !== "Deleted") {
      return loopar.throw({ code: 400, message: `${this.document}.${this.name} is not deleted.` });
    }

    if (await loopar.db.getValue(this.document, "name", this.docRef, { ifNotFound: false })) {
      return loopar.throw({ code: 400, message: `A new version of this registry has been created, it cannot be restored.` });
    }

    await loopar.db.setValue(this.document, "__document_status__", "Active", this.docRef);
    await loopar.db.setValue(this.document, "name", this.name, this.docRef);

    const h = await loopar.newDocument("Document History", await this.values());
    h.name = loopar.utils.randomString();
    h.action = "Restored";
    await h.save();

    return "Document restored successfully."
  }
}