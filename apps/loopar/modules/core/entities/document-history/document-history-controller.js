
'use strict';

import { BaseController, loopar } from 'loopar';

export default class DocumentHistoryController extends BaseController {
  constructor(props) {
    super(props);
  }

  // History reading / commenting / moderation now live on BaseController
  // (inherited by every entity controller, keyed by `this.document`), so a
  // document's history is served by its OWN controller. This controller only
  // keeps the soft-delete restore for the Document History list view itself.

  async actionRestore() {
    const ref = await loopar.getDocument(this.document, this.name);

    return this.success(await ref.restore());
  }
}
