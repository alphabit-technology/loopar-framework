'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import { loopar } from "../loopar.js";
import { lowercase, } from '../helper.js';
import { fileManage } from "../file-manage.js";
import { hash } from "../helper.js";

export default class CoreController extends AuthController {
   error = {};
   defaultImporterFiles = ['index', 'form'];
   response = {};
   #engineTemplate = 'pug';

   constructor(props) {
      super(props);
      this.exposeClientFiles();
   }

   hasData() {
      return Object.keys(this.data || {}).length > 0;
   }

   exposeClientFiles() {
      this.defaultImporterFiles.forEach(file => {
         this.router.use(express.static(loopar.makePath(this.controllerPath, file)));
      });

      this.router.use(this.express.static(loopar.makePath(loopar.pathRoot, this.controllerPath, "client")));
   }

   async clientImporter() {
      const document = this.document.replaceAll(/\s+/g, '-').toLowerCase();
      const client = this.client || this.workspace;
      const route = loopar.makePath(this.controllerPath, 'client', `${document}-${client}.js`).toLowerCase();
      const _route = await fileManage.existFile(route) ? `/${document}-${client}.js` : `/gui/document/${client}-context.js`;
      return loopar.makePath(_route);
   }

   getCodeError(code) {
      const validCodeErrors = [400, 401, 403, 404, 500];
      //const code_error = this.error[code] || this.error[500];

      return validCodeErrors.includes(code) ? code : 500;
   }

   async sendError(error) {
      const self = this;
      error = Object.keys(self.error).length === 0 ? error : self.error;

      error = {
         error: self.getCodeError(error.error),
         message: error.message || error,
      }

      try {
         if (error.error === 404) {
            return await self.notFound();
         }
         if (self.method === AJAX) {
            return this.res
               .status(error.error)
               .json({ error: 'Error ' + error.error, message: error.message }).send();

         } else {
            return await self.renderError({
               title: 'Error ' + error.error,
               message: error.message,
               error: error.error
            }, self.templateError(error.error));
         }
      } catch (e) {
         console.log(['Err on to try send error', e]);
      }
   }

   get engineTemplate() {
      return "." + this.#engineTemplate;
   }

   async renderError(data, template = null) {
      console.log("renderError", loopar.makePath(loopar.pathFramework, "workspace", template) + this.engineTemplate);

      this.res.render(loopar.makePath(loopar.pathFramework, "workspace", template) + this.engineTemplate, data);
   }

   redirect(url = null) {
      this.res.redirect(url || this.req.originalUrl);
   }

   templateError(code = null) {
      return `errors/${code || 'base-error'}`;
   }

   async render(meta, workspace = this.workspace, client_importer = null) {
      meta.action = this.action;
      const response = {
         meta: meta,
         key: this.getKey(),
         client_importer: client_importer || await this.clientImporter(),
         context: this.context
      }

      this.method === AJAX ? this.res.send(response) : await this.main(response, workspace);
   }

   async main(response = {}, workspace) {
      if (response.meta) response.meta = JSON.stringify(response.meta);

      const client_importer = await this.clientImporter();
      const WORKSPACE = { user: loopar.currentUser };

      if (workspace === "desk") {

         WORKSPACE.menu_data = this.hasSidebar ? await CoreController.sidebarData() : [];

      } else if (workspace === "web") {
         WORKSPACE.web_app = await this.#webApp();
      }

      this.res.render(loopar.makePath(loopar.pathFramework, "workspace", workspace) + this.engineTemplate, {
         ...response,
         document: lowercase(this.document),
         client_importer: client_importer,
         action: this.action,
         workspace: JSON.stringify(WORKSPACE),
         W: workspace,
         key: this.getKey()
      });
   }

   getKey(route = this.url) {
      const query = route.search ? route.search.split('?') : '';
      route.query = query[1] || '';

      const key = route.query.split('&').map(q => q.split('=')).filter(q => q[0] === 'documentName').join();

      return hash(`${route.pathname}${key}`.toLowerCase());
   }

   async notFound(message = null) {
      if (this.method === AJAX) {
         return this.res.status(404).json({ error: 'Not Found', message: message || 'Not Found' }).send();
      }
      this.controllerPath = loopar.makePath("apps/loopar/modules/core/notFound");
      this.document = "Not Found";
      this.client = "view";
      const document = await loopar.newDocument("Not Found");

      this.exposeClientFiles();

      return this.render(document);
   }

   static async sidebarData() {
      return loopar.modulesGroup;
   }

   async #webApp() {
      const exist = await loopar.db._count("App", loopar.defaultEebApp);
      if (exist) {
         const app = await loopar.getDocument("App", loopar.defaultWebApp);
         return await app.__data__();
      } else {
         this.renderError({
            title: 'Error',
            message: 'You don\'t have Install the Web App, please install it first and set as default',
            error: 404
         }, this.templateError(404));
         return {}
      }
   }

   async actionSearch() {
      const document = await loopar.newDocument(this.document, { module: this.module });
      const list = await document.getListToSelectElement(this.q);

      this.res.send(list);
   }

   async success(message, options = {}) {
      return await this.res.send({ success: true, message: message || "Success", ...options, notify: { type: "success", message: message || "Success" } });
   }

   async actionSidebar() {
      return await this.render({ sidebarData: await CoreController.sidebarData() });
   }
}