
'use strict';

import {BaseDocument, loopar} from 'loopar';
import SpamScanner from 'spamscanner';
import mailchecker from 'mailchecker';

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
    
    const scanner = new SpamScanner();
    const result = await scanner.scan(`${this.sender_name} ${this.subject} ${this.message}`);
    if (result.is_spam) {
      loopar.throw('Message rejected');
    }
  }

  async checkRateLimit(maxRequests = 5, windowMinutes = 15) {
    if (!this.ip_address) return;

    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const result = await loopar.db.sequelize.query(
      `SELECT COUNT(*) as count FROM ${loopar.db.tableName('Contact Message')} 
       WHERE "ip_address" = :ip AND "submitted_at" >= :windowStart`,
      {
        replacements: { ip: this.ip_address, windowStart },
        type: loopar.db.Sequelize.QueryTypes.SELECT
      }
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

      const variables = {
        name: this.sender_name,
        email: this.email,
        phone: this.phone || 'Not provided',
        subject: this.subject,
        message: this.message,
        submitted_at: this.submitted_at,
        source_page: this.source_page || 'Unknown'
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
      /* await loopar.mail.send({
        to: adminEmail,
        template: 'New Contact Message',
        variables: {
          name: this.sender_name,
          email: this.email,
          phone: this.phone || 'Not provided',
          subject: this.subject,
          message: this.message,
          submitted_at: this.submitted_at,
          source_page: this.source_page || 'Unknown'
        },
        priority: 'High'
      }); */


    } catch (error) {
      console.error('Failed to notify admin:', error.message);
    }
  }
}