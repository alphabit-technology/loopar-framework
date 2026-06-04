'use strict';

import { BaseDocument } from 'loopar';

/**
 * OAuth Settings — one row per social provider (google, github, …).
 * Pure config holder; the OAuth dance lives in the Auth controller
 * (controllers/auth/oauth.js + oauth-providers.js). No outward coupling.
 */
export default class OauthSettings extends BaseDocument {
  constructor(props) {
    super(props);
  }
}
