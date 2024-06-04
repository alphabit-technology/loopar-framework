'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import { loopar } from "loopar";
import pug from "pug";
import { MetaComponents } from "loopar";

//import { renderToHtml } from 'some-ui-framework'
import { escapeInject, dangerouslySkipEscape } from 'vike/server'


export default class CoreController extends AuthController {
  error = {};
  defaultImporterFiles = ['index', 'form'];
  response = {};
  #engineTemplate = 'pug';
  
  hasData() { 
    return Object.keys(this.data || {}).length > 0;
  }

  exposeClientFiles() {
    /*this.defaultImporterFiles.forEach(file => {
      loopar.server.use(express.static(loopar.makePath(this.controllerPath, file)));
    });*/

    loopar.server.use(express.static(loopar.makePath(loopar.pathRoot, this.controllerPath, "client")));
  }

  clientImporter(meta) {
    if(!meta.__DOCTYPE__) return {}

    const getClient = () => {
      if(this.client) return this.client;

      if(meta.__DOCTYPE__.is_single || this.workspace === "web") {
        return "view"
      }

      const action = this.action;
      if(['create', 'update'].includes(action)) {
        return "form";
      }else if(['list', 'index'].includes(action)) {
        return "list";
      }else {
        return "view"
      }
    }

    const document = meta.__DOCTYPE__.name;

    return {
      context: `${this.context}-context`,
      client: `${loopar.utils.decamelize(document, { separator: '-' })}-${getClient()}`,
    }
  }

  getCodeError(code) {
    const validCodeErrors = [400, 401, 403, 404, 500];
    //const code_error = this.error[code] || this.error[500];

    return validCodeErrors.includes(code) ? code : 500;
  }

  async sendAction(action) {
    action = `action${loopar.utils.Capitalize(action)}`
    if(typeof this[action] !== 'function') {
      return await this.notFound(`Action ${action} not found`);
    }
    return await this[action]();
  }

  async sendError(error) {
    return await this.renderError(error);
  }

  get engineTemplate() {
    return "." + this.#engineTemplate;
  }

  async renderError(error) {
    if (this.method === AJAX || !loopar.frameworkInstalled) {
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

  async render(meta, workspace = this.workspace) {
    meta.action = this.action;

    const response = {
      meta: meta,
      key: this.getKey(),
      client_importer: this.clientImporter(meta),
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
      WORKSPACE.web_app = loopar.webApp;//completedTransaction ? {} : await this.#webApp();
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
    //const templateRote = loopar.makePath(loopar.pathFramework, "template", "index") + ".ejs"
    const templateRote = loopar.makePath(loopar.pathFramework, "template", "index") + this.engineTemplate
    const vite = loopar.server.vite;
    
    const template = await vite.transformIndexHtml(url, pug.renderFile(templateRote, { 
      __META__: JSON.stringify(response),
      THEME: loopar.cookie.get('vite-ui-theme') || 'dark'
    }));

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
    const appHtml = await renderPage(url, response, this.req, this.res);
    
    let html = template.replace(`<!--ssr-outlet-->`, appHtml.appHtml);
    /*const _MetaComponents = MetaComponents(response, "client");

    html = html.replace(`<!--ssr-modulepreload-->`, `
      <link rel="modulepreload" href="/workspace/${response.W}/${response.W}-workspace.jsx">
      <link rel="modulepreload" href="/src/${response.client_importer.client}.jsx">
      <link rel="modulepreload" href="/src/entry-client.jsx">
    `);*/

    //${_MetaComponents.map(c => `<link rel="modulepreload" href="/components/${c.replaceAll("_", "-")}.jsx"/>`).join('\n')}
    /*html = html.replace(`<!--ssr-imported-->`, `
      <script type="module" async>
        import Workspace from "/workspace/${response.W}/${response.W}-workspace.jsx";
        import Document from "/src/${response.client_importer.client}.jsx";
        ${_MetaComponents.map(c => `import _${c}_ from "/components/${c.replaceAll("_", "-")}.jsx";`).join('\n')}

        window.__LOOPAR__ = {
          Workspace,
          Document,
        };

        window.__META_COMPONENTS__ = {
          ${_MetaComponents.map(c => `${c}: _${c}_`).join(',')}
        }

        import("/src/entry-client.jsx");
      </script>
    `);*/

    /*html = html.replace(`<!--ssr-imported-->`, `
      <script type="module" async>
        import("/src/entry-client.jsx");
      </script>
    `);*/

    //this.exposeClientFiles();

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