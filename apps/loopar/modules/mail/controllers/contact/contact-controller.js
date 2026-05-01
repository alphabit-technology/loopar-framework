
'use strict';

import {BaseController, loopar} from 'loopar';
import { Op} from '@sequelize/core';

export default class ContactController extends BaseController {
  static publicActions = ['submit'];

  async actionSubmit() {
    const data = this.data || {};

    const errors = this.validate(data);
    if (errors.length) {
      return this.error(errors.join(', '));
    }

    const ip = this.getClientIP();
    const isLimited = await this.checkRateLimit(ip);
    if (isLimited) {
      return this.error('Too many requests. Please try again later.');
    }

    try {
      const contact = await loopar.newDocument('Contact Message');
      
      contact.name = this.generateId();
      contact.sender_name = this.sanitize(data.name);
      contact.email = this.sanitize(data.email);
      contact.phone = this.sanitize(data.phone || '');
      contact.subject = this.sanitize(data.subject);
      contact.message = this.sanitize(data.message);
      contact.source_page = data.source_page || '';
      contact.ip_address = ip;
      contact.status = 'New';
      contact.submitted_at = new Date().toISOString();

      await contact.save();

      await this.notifyAdmin(contact);

      return this.success({
        message: 'Message sent successfully'
      });

    } catch (error) {
      console.error('Contact form error:', error);
      return this.error('Failed to send message. Please try again.');
    }
  }

  generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `CM-${timestamp}-${random}`.toUpperCase();
  }

  async notifyAdmin(contact) {
    try {
      const settings = await loopar.getDocument('Email Settings');
      const adminEmail = settings.notification_email || settings.from_email;

      if (!adminEmail) {
        console.warn('No notification email configured');
        return;
      }

      await loopar.mail.queue({
        to: adminEmail,
        template: 'New Contact Message',
        variables: {
          name: contact.sender_name,
          email: contact.email,
          phone: contact.phone || 'Not provided',
          subject: contact.subject,
          message: contact.message,
          submitted_at: contact.submitted_at,
          source_page: contact.source_page || 'Unknown'
        },
        priority: 'High'
      });
    } catch (error) {
      console.error('Failed to notify admin:', error.message);
    }
  }

  validate(data) {
    const errors = [];

    if (!data.name?.trim()) {
      errors.push('Name is required');
    } else if (data.name.length < 2) {
      errors.push('Name must be at least 2 characters');
    } else if (data.name.length > 100) {
      errors.push('Name must be less than 100 characters');
    }

    if (!data.email?.trim()) {
      errors.push('Email is required');
    } else if (!this.isValidEmail(data.email)) {
      errors.push('Invalid email address');
    }

    if (!data.subject?.trim()) {
      errors.push('Subject is required');
    } else if (data.subject.length > 200) {
      errors.push('Subject must be less than 200 characters');
    }

    if (!data.message?.trim()) {
      errors.push('Message is required');
    } else if (data.message.length < 10) {
      errors.push('Message must be at least 10 characters');
    } else if (data.message.length > 5000) {
      errors.push('Message must be less than 5000 characters');
    }

    if (this.containsSpam(data)) {
      errors.push('Message rejected');
    }

    return errors;
  }

  isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  sanitize(str) {
    if (!str) return '';
    return str
      .trim()
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '');
  }

  containsSpam(data) {
    const spamPatterns = [
      /\[url=/i,
      /\[link=/i,
      /viagra|cialis|casino|lottery|winner/i,
      /click here.*http/i,
      /earn.*\$.*day/i
    ];

    const text = `${data.name} ${data.subject} ${data.message}`.toLowerCase();
    return spamPatterns.some(pattern => pattern.test(text));
  }

  async checkRateLimit(ip, maxRequests = 5, windowMinutes = 15) {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();

    const recentCount = await loopar.db.count('Contact Message', {
      ip_address: ip,
      submitted_at: {[Op.gte]: windowStart}
    });

    return recentCount >= maxRequests;
  }

  getClientIP() {
    return this.req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           this.req.headers['x-real-ip'] ||
           this.req.connection?.remoteAddress ||
           'unknown';
  }

  success(data) {
    return { success: true, ...data };
  }

  error(message) {
    return { success: false, message };
  }
}