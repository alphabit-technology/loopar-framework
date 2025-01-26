'use strict'

import AuthController from "./auth-controller.js";
import { loopar } from "loopar";
import fs from 'fs';

export default class WorkspaceController extends AuthController {
  #engineTemplate = 'pug';

  get engineTemplate() {
    return "." + this.#engineTemplate;
  }

  async getWorkspace(workspace = this.workspace) {
    const meta = {};
    meta.action = this.action;

    const WORKSPACE = {
      user: loopar.currentUser,
      name: workspace
    }

    if (workspace === "desk") {
      WORKSPACE.menu_data =  await WorkspaceController.sidebarData();
    } else if (workspace === "web") {
      WORKSPACE.web_app = loopar.webApp;
    }

    return {
      key: this.getKey(),
      __WORKSPACE__: WORKSPACE,
      __DOCUMENT__: this.__DOCUMENT__
    }
  }

  async render(__META__, checkAuth = false) {
    if (checkAuth) {
      await this.beforeAction();
    }
    
    global.File = class SimulatedFile {
      constructor(buffer, fileName, options = {}) {
        this.buffer = Buffer.from(buffer);
        this.name = fileName || options.filename || 'untitled.txt';
        this.size = this.buffer.length;
        this.type = options.contentType || 'application/octet-stream';
      }
    }

    //const workSpaceName = __META__.__WORKSPACE__.name;
    const url = this.req.originalUrl;
    const isProduction = process.env.NODE_ENV == 'production';
    let HTML, template;

    const _p = (path) => loopar.makePath(loopar.pathRoot, path);
    
    if(isProduction) {
      const { render } = await import(_p("dist/server/entry-server.js"));
      HTML = await render(url, __META__, this.req, this.res);
      template = fs.readFileSync("dist/client/main.html", 'utf-8');
    }else{
      const vite = loopar.server.vite;
      const { render } = await vite.ssrLoadModule(_p("src/entry-server.jsx"));
      HTML = await render(url, __META__, this.req, this.res);
      template = await vite.transformIndexHtml(url, fs.readFileSync(_p("main.html"), 'utf-8'));
    }
    
    let html = template.replace(`<!--ssr-outlet-->`, HTML.HTML);
    html = html.replace('${THEME}', loopar.cookie.get('vite-ui-theme') || 'dark');
    html = html.replace('${title}', __META__.__DOCUMENT__?.activeParentMenu || __META__.__DOCUMENT__?.__DOCUMENT_TITLE__ || 'Loopar');

    html = html.replace(`<!--__loopar-meta-data__-->`, `
      <script id="__loopar-meta-data__" type="application/json">
        ${JSON.stringify(__META__)}
      </script>
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

  async actionSidebar() {
    return { sidebarData: await WorkspaceController.sidebarData() }
  }
}