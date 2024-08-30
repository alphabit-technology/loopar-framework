'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import { loopar } from "loopar";
import fs from 'fs';
import pug from 'pug';

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

  getCodeError(code) {
    const validCodeErrors = [400, 401, 403, 404, 500];
    //const code_error = this.error[code] || this.error[500];

    return validCodeErrors.includes(code) ? code : 500;
  }

  async sendAction(action) {
    action = `action${loopar.utils.Capitalize(action)}`
    if (typeof this[action] !== 'function') {
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
      WORKSPACE.web_app = loopar.webApp;
    }

    return await this.#send({
      ...response,
      action: this.action,
      workspace: JSON.stringify(WORKSPACE),
      W: workspace,
      key: this.getKey()
    });
  }

  clientImporter(meta) {
    if (!meta.__ENTITY__) return {}

    const getClient = () => {
      if (this.client) return this.client;

      if (meta.__ENTITY__.is_single || this.workspace === "web") {
        return "view"
      }

      const action = this.action;
      if (['create', 'update'].includes(action)) {
        return "form";
      } else if (['list', 'index'].includes(action)) {
        return "list";
      } else {
        return "view"
      }
    }

    const document = meta.__ENTITY__.name;

    return {
      context: `${this.context}-context`,
      client: `app/${loopar.utils.decamelize(document, { separator: '-' })}-${getClient()}`,
    }
  }

  async #send(response) {
    global.File = class SimulatedFile {
      constructor(buffer, fileName, options = {}) {
        this.buffer = Buffer.from(buffer);
        this.name = fileName || options.filename || 'untitled.txt';
        this.size = this.buffer.length;
        this.type = options.contentType || 'application/octet-stream';
      }
    }

    const isProduction = false// process.env.NODE_ENV === 'production';
    const clientTemplateRoute = loopar.makePath(loopar.pathRoot, isProduction ? 'dist/client/index.html' : 'index.html');
    const serverTemplateRoute = loopar.makePath(loopar.pathRoot, isProduction ? "dist/server/entry-server.js" : "src/entry-server.jsx");

    const ssrManifest = isProduction
      ? fs.readFileSync('./dist/client/.vite/manifest.json')
      : undefined

    const url = this.req.originalUrl;
    const vite = loopar.server.vite;
    //const {render} = await (isProduction ? import(serverTemplateRoute) : vite.ssrLoadModule(serverTemplateRoute));
    const { render } = await vite.ssrLoadModule(loopar.makePath(loopar.pathRoot, "src/entry-server.jsx"));
    /*let render;
    if(isProduction) {
      const module = await import(serverTemplateRoute);
      render = module.render;
    }else{
      const loadModule = await vite.ssrLoadModule(serverTemplateRoute);
      render = loadModule.render;
    }*/

    //const {render} = await vite.ssrLoadModule(serverTemplateRoute);

    const HTML = await render(url, response, this.req, this.res);
    const template = await vite.transformIndexHtml(url, fs.readFileSync(clientTemplateRoute, 'utf-8'));

    let html = template.replace(`<!--ssr-outlet-->`, HTML.HTML);
    html = html.replace('${THEME}', loopar.cookie.get('vite-ui-theme') || 'dark')
    html = html.replace(`<!--__loopar-meta-data__-->`, `
      <script id="__loopar-meta-data__" type="application/json">
        ${JSON.stringify(response)}
      </script>
    `);
    html = html.replace(`<!--ssr-modulepreload-->`, `
      <link rel="modulepreload" href="/workspace/${response.W}/${response.W}-workspace.jsx">
      <link rel="modulepreload" href="/src/${response.client_importer.client}.jsx">
      <link rel="modulepreload" href="/src/entry-client.jsx">
    `);

    if (response.W === 'web') {
      html = html.replace(`<!--web-head-->`, `
        <link rel="stylesheet" href="/node_modules/aos/dist/aos.css">
      `);
    }

    return {
      status: 200,
      body: html,
      headers: { 'Content-Type': 'text/html' }
    }
  }

  async #send1(response) {
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

    const url = this.req.originalUrl;
    const vite = loopar.server.vite;
    const { render } = await vite.ssrLoadModule('/src/entry-server.jsx');
    const appHtml = await render(url, response, this.req, this.res);

    const templateRote = loopar.makePath(loopar.pathFramework, "template", "index") + this.engineTemplate;
    //response.__REQUIRE_COMPONENTS__ = global.__REQUIRE_COMPONENTS__;

    const template = await vite.transformIndexHtml(url, pug.renderFile(templateRote, {
      __META__: JSON.stringify(response),
      THEME: loopar.cookie.get('vite-ui-theme') || 'dark'
    }));

    let html = template.replace(`<!--ssr-outlet-->`, appHtml.HTML);
    //const _MetaComponents = MetaComponents(response, "client");

    html = html.replace(`<!--ssr-modulepreload-->`, `
      <link rel="modulepreload" href="/workspace/${response.W}/${response.W}-workspace.jsx">
      <link rel="modulepreload" href="/src/${response.client_importer.client}.jsx">
      <link rel="modulepreload" href="/src/entry-client.jsx">
    `);

    return {
      status: 200,
      body: html,
      headers: { 'Content-Type': 'text/html' }
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
    return { success: true, message: message || "Success", ...options, notify: { type: "success", message: message || "Success" } };
  }

  async actionSidebar() {
    return { sidebarData: await CoreController.sidebarData() }
  }
}