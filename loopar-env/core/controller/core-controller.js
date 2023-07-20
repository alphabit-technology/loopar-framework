'use strict'

import express from "express";
import AuthController from "./auth-controller.js";
import {loopar} from "../loopar.js";
import {lowercase,} from '../helper.js';
import {file_manage} from "../file-manage.js";
import {hash} from "../helper.js";

export default class CoreController extends AuthController {
   error = {};
   default_importer_files = ['index', 'form'];
   response = {};
   #engineTemplate = 'pug';

   constructor(props) {
      super(props);
      this.expose_client_files();
   }

   has_data() {
      return Object.keys(this.data || {}).length > 0;
   }

   expose_client_files(){
      this.default_importer_files.forEach(file => {
         this.router.use(express.static(loopar.makePath(this.controller_path, file)));
      });

      this.router.use(this.express.static(loopar.makePath(loopar.path_root, this.controller_path, "client")));
   }

   async client_importer() {
      const document = this.document.replaceAll(/\s+/g, '-').toLowerCase();
      const client = this.client || this.workspace;
      const route = loopar.makePath(this.controller_path, 'client', `${document}-${client}.js`).toLowerCase();
      const _route = await file_manage.exist_file(route) ? `/${document}-${client}.js` : `/gui/document/${client}-context.js`;
      return loopar.makePath(_route);
   }

   get_code_error(code) {
      const valid_code_errors = [400, 401, 403, 404, 500];
      //const code_error = this.error[code] || this.error[500];

      return valid_code_errors.includes(code) ? code : 500;
   }

   async send_error(error) {
      const self = this;
      error = Object.keys(self.error).length === 0 ? error : self.error;

      error = {
         error: self.get_code_error(error.error),
         message: error.message || error,
      }

      try {
         if(error.error === 404) {
            return await self.not_found();
         }
         if (self.method === AJAX) {
            return this.res
               .status(error.error)
               .json({error: 'Error ' + error.error, message: error.message}).send();

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

   get engineTemplate(){
      return "." + this.#engineTemplate;
   }

   async renderError(data, template = null) {
      console.log("renderError", loopar.makePath(loopar.path_framework, "workspace", template) + this.engineTemplate);

      this.res.render(loopar.makePath(loopar.path_framework, "workspace", template) + this.engineTemplate, data);
   }

   redirect(url = null) {
      this.res.redirect(url || this.req.originalUrl);
   }

   templateError(code=null) {
      return `errors/${code || 'base-error'}`;
   }

   async render(meta, workspace = this.workspace, client_importer = null) {
      meta.action = this.action;
      const response = {
         meta: meta,
         key: this.getKey(),
         client_importer: client_importer || await this.client_importer(),
         context: this.context
      }

      this.method === AJAX ? this.res.send(response) : await this.main(response, workspace);
   }

   async main(response = {}, workspace) {
      if(response.meta) response.meta = JSON.stringify(response.meta);

      const client_importer = await this.client_importer();
      const WORKSPACE = {user: loopar.current_user};

      if(workspace === "desk") {
         
         WORKSPACE.menu_data = this.has_sidebar ? await CoreController.#sidebar_data() : [];
         
      } else if(workspace === "web") {
         WORKSPACE.web_app = await this.#web_app();
      }

      this.res.render(loopar.makePath(loopar.path_framework, "workspace", workspace) + this.engineTemplate, {
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

      const key = route.query.split('&').map(q => q.split('=')).filter(q => q[0] === 'document_name').join();

      return hash(`${route.pathname}${key}`.toLowerCase());
   }

   async not_found() {
      this.controller_path = loopar.makePath("apps/loopar/modules/core/notFound");
      this.document = "Not Found";
      this.client = "view";
      const document = await loopar.new_document("Not Found");

      this.expose_client_files();

      return this.render(document);
   }

   static async #sidebar_data() {
      return loopar.modules_group;
   }

   static async #menu_data() {
      //const menu = await loopar.get_document("Menu", "default");
      //return await menu.__data__();
   }

   async #web_app() {
      const exist = await loopar.db._count("App", loopar.default_web_app);
      if(exist){
         const app = await loopar.get_document("App", loopar.default_web_app);
         return await app.__data__();
      }else{
         this.renderError({
            title: 'Error',
            message: 'You don\'t have Install the Web App, please install it first and set as default',
            error: 404
         }, this.templateError(404));
         return {}
      }
   }

   async action_search() {
      const document = await loopar.new_document(this.document, {module: this.module});
      const list = await document.get_list_to_select_element(this.q);

      this.res.send(list);
   }

   async success(message, options={}) {
      return await this.res.send({success: true, message: message || "Success", ...options});
   }

   async action_sidebar() {
      return await this.render({sidebarData: await CoreController.#sidebar_data()});
   }
}