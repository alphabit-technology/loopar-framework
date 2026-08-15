
'use strict';

import { SingleController, loopar } from 'loopar';

export default class AltchaController extends SingleController {
  static publicActions = ['challenge'];

  constructor(props) {
    super(props);
  }

  /**
   * Issue a fresh proof-of-work challenge for browser widgets. Returns
   * challenge=null when the integration is off, which tells clients to try
   * the next provider (Turnstile) or render nothing.
   *
   * NOTE: plain object on purpose — NOT this.success(). The client http
   * layer resolves success callbacks with `data?.message || data`, so any
   * response carrying a `message` collapses to that string and the payload
   * is lost. Data endpoints must return message-less bodies (same pattern
   * as publicActionComments' { rows }).
   */
  async publicActionChallenge() {
    const altcha = await loopar.getDocument('Altcha');

    if (!altcha.isActive()) {
      return { challenge: null };
    }

    const challenge = await altcha.createFormChallenge();
    return { challenge };
  }
}
