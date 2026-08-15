
'use strict';

import { SingleController, loopar } from 'loopar';

export default class TurnstileController extends SingleController {
  static publicActions = ['siteKey'];

  constructor(props) {
    super(props);
  }

  /**
   * Public config for browser widgets (contact form, guest comments,
   * reviews). Only the site key is exposed — it is public by design; the
   * secret never leaves the server. Returns '' when the integration is off,
   * which tells clients to not render the widget at all.
   */
  async publicActionSiteKey() {
    const turnstile = await loopar.getDocument('Turnstile');
    return { site_key: turnstile.publicSiteKey() };
  }
}
