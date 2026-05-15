'use strict'

import AuthController from "../auth/AuthController.js";
import { loopar, fileManager, PermissionManager } from "loopar";
import { shouldServeProduction, isDevTenant } from "../server/runtime-mode.js";
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
    // For the dev tenant, the mode decision is dynamic per-render: if the
    // tenant's .env says production AND a built dist exists, serve from
    // the bundle; otherwise fall back to Vite's source-file rendering.
    // For all other tenants, stick with the startup decision (process env).
    const isProduction = isDevTenant()
      ? shouldServeProduction()
      : process.env.NODE_ENV == 'production';
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
    // The cookie now stores a resolved value ("light" | "dark"). Older clients
    // may still have the legacy "system" value; fall back to "dark" in that
    // case — the inline FOUC script in main.html will correct it client-side
    // before the first paint if the OS preference is actually light.
    const cookieTheme = loopar.cookie.get('vite-ui-theme');
    const ssrTheme =
      cookieTheme === 'light' || cookieTheme === 'dark' ? cookieTheme : 'dark';
    html = html.replace('${THEME}', ssrTheme);

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
            // Reflects the *runtime* mode the client is being served with,
            // not the cached process.env.NODE_ENV — so the dev tenant's
            // client matches what the server actually decided this render.
            NODE_ENV: isProduction ? 'production' : 'development',
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