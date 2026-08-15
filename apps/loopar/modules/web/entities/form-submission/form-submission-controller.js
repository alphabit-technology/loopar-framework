
'use strict';

import { BaseController } from 'loopar';

/**
 * Desk-only CRUD for stored submissions. The public submit endpoint lives in
 * PageController.publicActionSubmitForm — the page validates against its own
 * metadata and calls FormSubmission.register() for storage.
 */
export default class FormSubmissionController extends BaseController {
  constructor(props) {
    super(props);
  }
}
