'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import { loopar } from "loopar";
import { fileManage } from "../file-manage.js";
import pug from "pug";

export default class CoreController extends AuthController {
  error = {};
  defaultImporterFiles = ['index', 'form'];
  response = {};
  #engineTemplate = 'pug';
  
  hasData() {
    return Object.keys(this.data || {}).length > 0;
  }

  exposeClientFiles() {
    this.defaultImporterFiles.forEach(file => {
      loopar.server.use(express.static(loopar.makePath(this.controllerPath, file)));
    });

    loopar.server.use(express.static(loopar.makePath(loopar.pathRoot, this.controllerPath, "client")));
  }

  async clientImporter() {
    const document = this.document.replaceAll(/\s+/g, '-').toLowerCase();
    const client = this.client || this.workspace;
    const route = loopar.makePath(this.controllerPath, 'client', `${document}-${client}.jsx`).toLowerCase();
    this.moduleRoute = route;
    const exist = await fileManage.existFile(route)// ? `${document}-${client}` : `/gui/document/${client}-context`;

    return {
      context: `${client}-context`,
      client: exist ? `${document}-${client}` : null
    };
  }

  getCodeError(code) {
    const validCodeErrors = [400, 401, 403, 404, 500];
    //const code_error = this.error[code] || this.error[500];

    return validCodeErrors.includes(code) ? code : 500;
  }

  async sendError(error) {
    return await this.renderError(error);
  }

  get engineTemplate() {
    return "." + this.#engineTemplate;
  }

  async renderError(error) {
    if (this.method === AJAX) {
      return error;
    }

    /**Render page of Error defined on System */
    this.controllerPath = loopar.makePath("apps/loopar/modules/core/error");
    this.document = "Error";
    this.client = "view";
    const document = await loopar.getErrDocument();
    document.__DOCUMENT__ = error;

    return await this.render(document);
  }

  async notFound(message = null) {
    this.controllerPath = loopar.makePath("apps/loopar/modules/core/notFound");
    this.document = "Not Found";
    this.client = "view";
    const document = await loopar.newDocument("Not Found");

    return await this.render(document);
  }

  redirect(url = null) {
    this.res.redirect(url || this.req.originalUrl);
  }

  /*templateError(code = null) {
    return `errors/${code || 'base-error'}`;
  }*/

  async render(meta, workspace = this.workspace, clientImporter = null) {
    meta.action = this.action;

    const response = {
      meta: meta,
      key: this.getKey(),
      client_importer: clientImporter || await this.clientImporter(),
      context: this.context,
      action: this.action,
    }

    return this.method === AJAX ? response : await this.main(response, workspace);
  }

  async main(response = {}, workspace) {
    if (response.meta) response.meta = JSON.stringify(response.meta);

    const WORKSPACE = { user: loopar.currentUser };

    if (workspace === "desk") {
      WORKSPACE.menu_data = this.hasSidebar ? await CoreController.sidebarData() : [];
    } else if (workspace === "web") {
      WORKSPACE.web_app = loopar.completedTransaction ? {} : await this.#webApp();
    }
    
    return await this.#send({
      ...response,
      action: this.action,
      workspace: JSON.stringify(WORKSPACE),
      W: workspace,
      key: this.getKey()
    });
  }

  async #send(response) {
    const url = this.req.originalUrl;
    const templateRote = loopar.makePath(loopar.pathFramework, "template", "index") + this.engineTemplate
    const vite = loopar.server.vite;
    const template = await vite.transformIndexHtml(url, pug.renderFile(templateRote, { __META__: JSON.stringify(response) }));

    global.File = class SimulatedFile {
      constructor(buffer, fileName, options = {}) {
        this.buffer = Buffer.from(buffer);
        this.name = fileName || options.filename || 'untitled.txt';
        this.size = this.buffer.length;
        this.type = options.contentType || 'application/octet-stream';
      }
    }
    global.theme = 'dark';
    global.getTheme = () => { };

    const { renderPage } = await vite.ssrLoadModule('/src/entry-server.jsx');
    const appHtml = await renderPage(url, response, "server");
    
    const html = template.replace(`<!--ssr-outlet-->`, appHtml.appHtml);

    return {
      status: 200,
      body: html,
      headers: { 'Content-Type': 'text/html' }
    }
  }

  getKey(route = this.dictUrl) {
    const query = route.search ? route.search.split('?') : '';
    route.query = query[1] || '';

    const key = route.query.split('&').map(q => q.split('=')).filter(q => q[0] === 'documentName').join();

    return loopar.utils.hash(`${route.pathname}${key}`.toLowerCase());
  }

  static async sidebarData() {
    return loopar.modulesGroup;
  }

  async #webApp() {
    const settings = await loopar.getDocument("System Settings");

    if (await loopar.db.getValue("App", "name", settings.active_web_app)) {
      const app = await loopar.getDocument("App", settings.active_web_app);
      return await app.__data__();
    } else {
      /*loopar.throw({
        type: 'error',
        title: 'Error',
        message: 'You don\'t have Install the Web App, please install it first and set as default'
      });*/
      return {}
    }
  }

  async actionSearch() {
    const document = await loopar.newDocument(this.document, { module: this.module });
    return await document.getListToSelectElement(this.q);
  }

  async success(message, options = {}) {
    return { success: true, message: message || "Success", ...options, notify: { type: "success", message: message || "Success" } };
  }

  async actionSidebar() {
    return { sidebarData: await CoreController.sidebarData() }
  }
}