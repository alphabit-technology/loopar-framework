import nodemailer from 'nodemailer';
import { loopar } from '../loopar.js';

class EmailService {
  transporter = null;
  settings = null;
  templateCache = new Map();

  async getSettings() {
    if (!this.settings) {
      this.settings = await loopar.getDocument('Email Settings', 'Email Settings');
    }
    return this.settings;
  }

  async getTransporter() {
    const settings = await this.getSettings();
    
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: settings.host,
        port: parseInt(settings.port),
        secure: settings.secure == 1,
        auth: settings.auth_enabled == 1 ? {
          user: settings.user,
          pass: settings.password
        } : undefined,
        connectionTimeout: parseInt(settings.timeout) || 5000,
        pool: true,
        maxConnections: parseInt(settings.max_connections) || 5,
        rateDelta: 1000,
        rateLimit: parseInt(settings.rate_limit) || 10,
        debug: settings.debug == 1,
        logger: settings.debug == 1
      });
    }
    
    return this.transporter;
  }

  // Reemplaza variables {{variable}} en el texto
  parseTemplate(text, variables = {}) {
    if (!text) return '';
    
    return text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, key) => {
      // Soporta variables anidadas: {{user.name}}
      const value = key.split('.').reduce((obj, k) => obj?.[k], variables);
      return value !== undefined ? value : match;
    });
  }

  async getTemplate(templateName) {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName);
    }

    try {
      const template = await loopar.getDocument('Email Template', templateName);
      
      if (!template.enabled) {
        throw new Error(`Template "${templateName}" is disabled`);
      }
      
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      throw new Error(`Template "${templateName}" not found`);
    }
  }

  async send({ to, subject, html, text, attachments = [], cc, bcc, replyTo }) {
    const settings = await this.getSettings();
    const transporter = await this.getTransporter();

    const mailOptions = {
      from: `"${settings.from_name}" <${settings.from_email}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html?.replace(/<[^>]*>/g, ''),
      replyTo: replyTo || settings.reply_to || undefined,
      cc,
      bcc,
      attachments
    };

    try {
      const result = await transporter.sendMail(mailOptions);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Email send error:', error);
      return { success: false, error: error.message };
    }
  }

  // Enviar usando plantilla
  async sendTemplate({ template, to, variables = {}, attachments = [], cc, bcc, replyTo }) {
    try {
      const tpl = await this.getTemplate(template);
      
      const subject = this.parseTemplate(tpl.subject, variables);
      const html = this.parseTemplate(tpl.body, variables);

      return await this.send({
        to,
        subject,
        html,
        attachments,
        cc,
        bcc,
        replyTo
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Previsualizar plantilla sin enviar
  async previewTemplate(templateName, variables = {}) {
    const template = await this.getTemplate(templateName);
    
    return {
      subject: this.parseTemplate(template.subject, variables),
      html: this.parseTemplate(template.body, variables)
    };
  }

  async testConnection() {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  reset() {
    this.transporter = null;
    this.settings = null;
    this.templateCache.clear();
  }
}

export const emailService = new EmailService();