'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import { loopar } from "loopar";
import { titleize } from "inflection";

export default class CoreController extends AuthController {
  error = {};
  defaultImporterFiles = ['index', 'form'];
  response = {};

  hasData() {
    return Object.keys(this.data || {}).length > 0;
  }

  exposeClientFiles() {
    loopar.server.use(express.static(loopar.makePath(loopar.pathRoot, this.controllerPath, "client")));
  }

  async sendAction(action) {
    action = `action${loopar.utils.Capitalize(action)}`;
    if (typeof this[action] !== 'function') {
      return await this.notFound({
        code: 404,
        title: "Action not found",
        description: `The action ${action} not found.`
      });
    }

    await this.beforeAction();

    return await this[action]();
  }

  async notFound({code = 404, title = "Not Found", description = "The page you are looking for does not exist"} = {}) {
    const document = await loopar.newDocument("Error");

    document.__DOCUMENT__ = {
      code: code || 404,
      title: title || `Document ${titleize(this.document)} not found`,
      description: description || "The document you are looking for does not exist",
    };

    return await this.render(document);
  }

  async getError(code, { title = "Error", description = "An error occurred" } = {}) {
    const document = await loopar.newDocument("Error");

    document.__DOCUMENT__ = {
      code: code,
      title: title,
      description: description,
    };

    return await this.render(document);
  }

  redirect(url = null) {
    return { redirect: url };
  }

  async render(__DOCUMENT__) {
    __DOCUMENT__.action = this.action;

    return {
      client_importer: this.clientImporter(__DOCUMENT__),
      key: this.getKey(),
      ...__DOCUMENT__,
      __DOCUMENT_TITLE__: titleize(this.name || this.document || "Document"),
    }
  }

  clientImporter(__DOCUMENT__) {
    if (!__DOCUMENT__.__ENTITY__) return {};

    const getClient = () => {
      if(["Page", "View"].includes(__DOCUMENT__.__ENTITY__.type)) return "view";
      if (this.client) return this.client;
      

      const action = this.action;
      if (['create', 'update'].includes(action)) {
        return "form";
      } else if (['list', 'index'].includes(action)) {
        return "list";
      } else {
        return "view"
      }
    }

    const document = __DOCUMENT__.__ENTITY__.name;

    return {
      context: `${this.context}-context`,
      client: `app/${loopar.utils.decamelize(document, { separator: '-' })}-${getClient()}`,
    }
  }

  getKey(route = this.dictUrl) {
    const query = route.search ? route.search.split('?') : '';
    route.query = query[1] || '';

    const key = route.query.split('&').map(q => q.split('=')).filter(q => q[0] === 'name').join();

    return loopar.utils.hash(`${route.pathname}${key}`.toLowerCase());
  }

  static async sidebarData() {
    return loopar.modulesGroup;
  }

  async actionSearch() {
    const document = await loopar.newDocument(this.document, { module: this.module });
    return await document.getListToSelectElement(this.q);
  }

  async success(message, options = {}) {
    return { status: 200, success: true, message: message || "Success", ...options, notify: { type: "success", message: message || "Success" } };
  }

  async actionSidebar() {
    return { sidebarData: await CoreController.sidebarData() }
  }
}