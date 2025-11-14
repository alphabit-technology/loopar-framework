'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import { loopar } from "loopar";
import { titleize } from "inflection";
import _ from "lodash";

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
    const doc = await loopar.newDocument("Error");
    const document = await doc.__meta__();
    
    if(typeof arguments[0] === 'string') {
      code = "404";
      title = !arguments[1] ? "Not Found" : arguments[0];
      description = arguments[1] || arguments[0];
    }

    document.data = {
      code: code || 404,
      title: title || `Document ${titleize(this.document)} not found`,
      description: description || "The document you are looking for does not exist",
    };

    if(this.method === "POST") {
      return document.data;
    }
    return await this.render(document);
  }

  async servePrivateFile(file) {
    await this.beforeAction();

    const document = await loopar.newDocument("File Manager", {
      name: file
    });

    const privateFile = await document.getPrivateFile();
    if (!privateFile) {
      return await this.notFound({
        code: 404,
        title: "Source not found",
        description: `The soruce ${file} not found.`,
      });
    }
    if (privateFile.error) {
      return await this.notFound({
        code: 403,
        title: "Access Denied",
        description: privateFile.error,
      });
    }
    if (privateFile.path) {
      const filePath = loopar.makePath(loopar.pathRoot, privateFile.path);
      if (filePath) {
        const fileName = privateFile.name || file;
        const fileType = privateFile.type || "application/octet-stream";
        const fileSize = privateFile.size || 0;
      }
    }

    document.data = { file }

    return await this.render(document);
  }

  redirect(url = null) {
    return { redirect: url };
  }

  /* async render(meta) {
    return _.merge(meta, {
      data: { file }
    });
  } */

  redirect(url = null) {
    return { redirect: url };
  }

  async getError(code, { title = "Error", description = "An error occurred.." } = {}) {
    const document = await loopar.newDocument("Error");

    return await this.render({
      ...await document.__meta__(),
      data: {
        code: code,
        title: title,
        description: description,
      }
    });
  }

  async render(meta) {
    return _.merge(meta, {
      key: this.getKey(),
      instance: this.getInstance(),
      meta: {
        title: titleize(meta.title || this.name || this.document || "Document"),
        action: this.action,
      },
      entryPoint: this.clientImporter(meta),
    });
  }

  clientImporter(Document) {
    if (!Document) return null;

    const getClient = () => {
      if(["Page", "View"].includes(Document.Entity.type)) return "view";
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

    const name = Document.Entity.name;

    return `${loopar.utils.decamelize(name, { separator: '-' })}-${getClient()}`
  }

  getKey(route = this.dictUrl) {
    return loopar.utils.urlHash(route);
  }

  getInstance(route = this.dictUrl) {
    return loopar.utils.urlInstance(route);
  }

  static async sidebarData() {
    return loopar.modulesGroup;
  }

  async actionSearch() {
    const document = await loopar.newDocument(this.document, { module: this.module });
    return await document.getListToSelectElement(this.q);
  }

  async success(message, options = {}) {
    return { status: 200, success: true, message: message || "Success", ...options, notify: options.notify || { type: "success", message: message || "Success" } };
  }

  async actionSidebar() {
    return { sidebarData: await CoreController.sidebarData() }
  }
}