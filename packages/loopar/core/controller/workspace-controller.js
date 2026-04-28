'use strict'

import AuthController from "../auth/AuthController.js";
import { loopar, fileManager, PermissionManager } from "loopar";
import fs from 'fs';

export default class WorkspaceController extends AuthController {
  constructor(props) {
    super(props);
    Object.assign(this, props);
  }

  async getWorkspace(workspace = this.workspace) {
    const meta = {};
    meta.action = this.action;

    const WORKSPACE = {
      name: workspace,
      user: loopar.currentUser,
    }

    if (workspace === "desk") {
      WORKSPACE.menu_data =  await WorkspaceController.sidebarData();
    } else if (workspace === "web") {
      WORKSPACE.web_app = loopar.webApp;
    }

    return {
      key: this.getKey(),
      ...WORKSPACE,
      Document: {
        meta: {
          action: this.action
        },
        data: this.__DATA__
      }
    }
  }

  hasPermission(document, action){
    return true
  }

  async render(__META__, checkAuth = false) {
    if (checkAuth) {
      ///await this.beforeAction();
    }
    
    global.File = class SimulatedFile {
      constructor(buffer, fileName, options = {}) {
        this.buffer = Buffer.from(buffer);
        this.name = fileName || options.filename || 'untitled.txt';
        this.size = this.buffer.length;
        this.type = options.contentType || 'application/octet-stream';
      }
    }

    const url = this.req.originalUrl;
    const isProduction = process.env.NODE_ENV == 'production';
    let HTML;

    const _p = (path) => loopar.makePath(loopar.pathRoot, path);
    
    const [{ render }, template] = await Promise.all([
      isProduction
        ? import(_p("dist/server/entry-server.js"))
        : loopar.server.vite.ssrLoadModule(_p("app/entry-server.jsx")),
    
      isProduction
        ? fs.readFileSync("dist/client/main.html", "utf-8")
        : loopar.server.vite.transformIndexHtml(
            url,
            fs.readFileSync(_p("main.html"), "utf-8")
          ),
    ]);
    const userData = await loopar.auth.award(false);
    const username = userData?.name || "Guest";

    const permissions = PermissionManager.getPermissions(username);

    HTML = await render(url, __META__, this.req, this.res, permissions);
    
    __META__.site = loopar.tenantId;
    __META__.userId = userData?.name;
    __META__.csrfToken = userData?.csrfToken ?? null;
    __META__.permissions = permissions
    
    let html = template.replace(`<!--ssr-outlet-->`, HTML.HTML);
    html = html.replace('${THEME}', loopar.cookie.get('vite-ui-theme') || 'dark');

    const faviconSrc = fileManager.getMappedFiles(__META__.web_app?.favicon)[0]?.src;

    html = html.replace(`<!--__favicon__-->`, `<link rel="icon" href="${faviconSrc || "/assets/public/loopar-favicon.ico"}"/>`)

    html = html.replace(`<!--__theme-definition__-->`, `
      <link rel="stylesheet" href="/assets/public/theme.css"/>
    `)

    html = html.replace(`<!--__loopar-meta-data__-->`, `
      <script id="__loopar-meta-data__" type="application/json">
        ${JSON.stringify(__META__)}
      </script>
    `);

    html = html.replace(`<!--__loopar-env__-->`, `
      <script>
        window.process = ${JSON.stringify({
          env: {
            TENANT_ID: process.env.TENANT_ID,
            NODE_ENV: process.env.NODE_ENV,
          }
        })};
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
}