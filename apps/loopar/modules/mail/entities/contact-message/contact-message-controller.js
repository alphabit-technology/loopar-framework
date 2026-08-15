
'use strict';

import {BaseController, loopar} from 'loopar';

const MIN_FILL_TIME_MS = 3000;

export default class ContactMessageController extends BaseController {
  static publicActions = ['submit'];

  async publicActionSubmit() {
    const data = this.data || {};

    // --- Layer 1a: honeypot -------------------------------------------------
    // `_hp` is invisible to humans; anything in it means a bot filled the
    // form blindly. Answer with a fake success so the bot moves on.
    if ((data._hp || '').trim()) {
      return this.success('Message sent successfully');
    }

    // --- Layer 1b: minimum fill time ---------------------------------------
    // `_elapsed` is set by the widget (ms since render). Missing (direct API
    // POST) or too fast (headless auto-fill) is a strong bot signal; it feeds
    // the spam score instead of hard-rejecting, to protect false positives.
    const elapsed = Number(data._elapsed);
    const fastFill = !Number.isFinite(elapsed) || elapsed < MIN_FILL_TIME_MS;

    const ip = this.getClientIP();

    // --- Layer 3: captcha (ALTCHA proof-of-work or Turnstile) --------------
    // First active provider wins; the inner try/catch covers installs where
    // an entity's schema hasn't been migrated yet.
    let humanVerified = false;
    for (const provider of ['Altcha', 'Turnstile']) {
      let integration = null;
      try {
        integration = await loopar.getDocument(provider);
      } catch (error) {
        continue; // not installed yet
      }

      if (integration?.isActive?.()) {
        humanVerified = await integration.assertHuman(data.captcha_token, ip);
        break;
      }
    }

    // Whitelist: never mass-assign client data into the document (a bot
    // could otherwise set status, admin_notes or even the primary name).
    const contact = await loopar.newDocument('Contact Message', {
      sender_name: data.sender_name,
      email: data.email,
      phone: data.phone || '',
      subject: data.subject,
      message: data.message,
      source_page: data.source_page || ''
    });

    contact.ip_address = ip;

    // Spam is stored silently (status = Spam, no admin email) but the sender
    // still sees a normal success — no feedback loop to iterate against.
    await contact.send({ fastFill, humanVerified });

    return this.success('Message sent successfully');
  }

  getClientIP() {
    return this.req?.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ||
           this.req?.headers?.['x-real-ip'] ||
           this.req?.socket?.remoteAddress ||
           this.req?.connection?.remoteAddress ||
           '';
  }
}
