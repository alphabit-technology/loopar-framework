
'use strict';

import {BaseDocument, loopar} from 'loopar';
import mailchecker from 'mailchecker';

const SPAM_THRESHOLD = 2;

function detectSpamHeuristics(text) {
  const hits = [];
  if (!text) return { score: 0, hits };

  const urls = text.match(/https?:\/\/|www\./gi) || [];
  if (urls.length >= 3) hits.push('too-many-urls');

  const letters = text.match(/[A-Za-z]/g) || [];
  const upper = text.match(/[A-Z]/g) || [];
  if (letters.length >= 50 && upper.length / letters.length > 0.6) hits.push('too-much-caps');

  if (/(.)\1{6,}/.test(text)) hits.push('char-repeat');

  const SPAM_RE = new RegExp(
    String.raw`\b(viagra|cialis|casino|porn|crypto|bitcoin|nft|airdrop|forex|` +
    String.raw`make money fast|earn \$\d+|click here|limited time|act now|` +
    String.raw`investment opportunity|guaranteed return|seo backlinks)\b`,
    'i'
  );
  if (SPAM_RE.test(text)) hits.push('spam-keyword');

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations >= 6) hits.push('too-many-exclamations');

  if (/\[\s*(at|dot)\s*\]/i.test(text)) hits.push('obfuscated-contact');

  return { score: hits.length, hits };
}

export default class ContactMessage extends BaseDocument {
  async beforeSave() {
    if (this.__IS_NEW__) {
      this.name = this.generateId();
      this.status = 'New';
      this.submitted_at = new Date().toISOString();
    }
  }

  async send() {
    this.validateFields();
    this.checkSpam();
    await this.checkRateLimit();
  
    this.sanitizeFields();
    //await this.save();
    //this.notifyAdmin();
    return true
  }

  validateFields() {
    if (!this.sender_name?.trim())
      loopar.throw('Name is required');
    
    if (this.sender_name.length < 2 || this.sender_name.length > 100)
      loopar.throw('Name must be between 2 and 100 characters');
    
    if (!this.email?.trim()) 
      loopar.throw('Email is required');
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email)) 
      loopar.throw('Invalid email address');

    if (!this.subject?.trim())
      loopar.throw('Subject is required');
    
    if (this.subject.length > 200)
      loopar.throw('Subject must be less than 200 characters');

    if (!this.message?.trim())
      loopar.throw('Message is required');

    if (this.message.length < 10 || this.message.length > 5000)
      loopar.throw('Message must be between 10 and 5000 characters');
  }

  async checkSpam() {
    if (!mailchecker.isValid(this.email)) {
      loopar.throw('Disposable emails not allowed');
    }

    const haystack = `${this.sender_name} ${this.subject} ${this.message}`;
    const { score, hits } = detectSpamHeuristics(haystack);

    if (score >= SPAM_THRESHOLD) {
      console.warn(`[contact-message] rejected as spam (score=${score}):`, hits);
      loopar.throw('Message rejected');
    }
  }

  async checkRateLimit(maxRequests = 5, windowMinutes = 15) {
    if (!this.ip_address) return;

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    // Backend-agnostic: rawQuery() returns flat rows on both Sequelize and Knex.
    // Switched from named (:ip) to positional (?) placeholders since named
    // placeholders are Sequelize-specific.
    const result = await loopar.db.rawQuery(
      `SELECT COUNT(*) as count FROM ${loopar.db.tableName('Contact Message')}
       WHERE ${loopar.db.escapeId('ip_address')} = ?
         AND ${loopar.db.escapeId('submitted_at')} >= ?`,
      [this.ip_address, windowStart]
    );

    if ((result[0]?.count || 0) >= maxRequests) {
      loopar.throw('Too many requests. Please try again later.');
    }
  }

  sanitizeFields() {
    const sanitize = (str) => {
      if (!str) return '';
      return str.trim().replace(/<[^>]*>/g, '');
    };

    this.sender_name = sanitize(this.sender_name);
    this.email = sanitize(this.email);
    this.phone = sanitize(this.phone || '');
    this.subject = sanitize(this.subject);
    this.message = sanitize(this.message);
  }

  generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `CM-${timestamp}-${random}`.toUpperCase();
  }

  async notifyAdmin() {
    try {
      const settings = await loopar.getDocument('Email Settings');
      const adminEmail = settings.notification_email || settings.from_email;

      if (!adminEmail) {
        console.warn('No notification email configured');
        return;
      }

      await loopar.mail.send({
        to: adminEmail,
        replyTo: this.email,
        subject: `New Contact: ${this.subject}`,
        html: `
          <h2>New message from ${this.sender_name}</h2>
          <p><strong>Email:</strong> ${this.email}</p>
          <p><strong>Phone:</strong> ${this.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${this.subject}</p>
          <hr>
          <p>${this.message}</p>
        `
      });
    } catch (error) {
      console.error('Failed to notify admin:', error.message);
    }
  }
}