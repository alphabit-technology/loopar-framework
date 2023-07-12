'use strict';
import path from "path";
import {Capitalize, decamelize, lowercase} from './helper.js';
import {Loopar, loopar} from './loopar.js';
import {file_manage} from "./file-manage.js";
import multer from "multer";

export default class Router {
   #route_structure = ["host", "module", "document", "action"];
   controller = 'base-controller';
   debugger = false;

   constructor(options) {
      Object.assign(this, options);

      /*const storage = multer.diskStorage({
         destination: function (req, file, cb) {
            cb(null, path.join(loopar.path_root, "public", 'uploads/'));
         },
         filename: function (req, file, cb) {
            cb(null, file.originalname);
         }
      });*/

      this.uploader = multer({ storage: multer.memoryStorage() }).any();
      
   }

   get #pathname() {
      return this.url ? this.url.pathname : null;
   }

   get #is_asset_url() {
      if (!this.#pathname) return false;

      const url = this.#pathname.split("?");
      const base_url = url[0].split("/");
      const source = base_url[base_url.length - 1];

      if (url[1]) return false;
      if (source.includes(".html")) return true;
      return source.includes(".") && source.split(".")[1].length > 0;
   }

   use(middleware) {
      this.server._router.stack = this.server._router.stack.filter(layer => layer.handle !== this.#custom404Middleware);
      this.server.use(middleware);
      this.server.use(this.#custom404Middleware);
   }

   #custom404Middleware = (req, res, next) => {
      res.status(404).send(`
            <div style="display: flex; justify-content: center; align-items: center; height: 100%; flex-direction: column; background-color: #0b0b0f; color: #95b3d6;">
               <h1 style="font-size: 100px; margin: 0;">404</h1>
               <h3 style="font-size: 30px; margin: 0;">Source not found</h3>
               <span style="font-size: 20px; margin: 0;">${req.url}</span>
               <hr style="width: 50%; margin: 20px 0;"/>
               <span style="font-size: 20px; margin: 0;">Loopar</span>
            </div>
         `);
   };

   route() {

      const loadHttp = (req, res, next) => {
         this.data = req.body;

         if(req.files && req.files.length > 0){
            this.data.req_upload_files = req.files;
         }
         this.method = req.method;

         this.#make_workspace()
      }

      this.server.use((req, res, next) => {
         this.res = res;
         this.req = req;
         this.url = req._parsedUrl;
         this.pathname = this.url.pathname;

         if(this.#is_asset_url){
            next();
         }else {
            if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
               this.uploader(req, res, err => {
                  if (err instanceof multer.MulterError) {
                     console.log('A Multer error is detected', err);
                     //return res.status(500).json({error: err.message});
                  } else if (err) {
                     //console.log('Error', err);
                     return res.status(500).json({error: err.message});
                  }
                  loadHttp(req, res, next);
               });
            } else {
               loadHttp(req, res, next);
            }
         }
      });

      this.server.use(this.#custom404Middleware);
   }

   #make_workspace() {
      this.controller = "base-controller";
      this.#route_structure.forEach(prop => {
         if (prop.toString().length > 0) this[prop] = null;
      });
      this.client = null;

      let url = this.pathname;

      const context = this.url.pathname.split("/")[1];
      const workspace = ['desk', 'auth', 'api', 'loopar'].includes(context) ? context : 'web';

      if(workspace === "loopar") {
         this.workspace = 'auth';
         this.client = 'installer';
      }else if(workspace === "api"){
         url = "/desk" + this.pathname.split("api")[1];
         this.workspace = 'desk';
         this.api_request = true;
      }else if(workspace === 'auth'){
         url = "/auth" + this.pathname.split("auth")[1];
         this.workspace = 'auth';
      }else if(workspace === 'desk'){
         url = this.pathname.split("desk")[1];
         this.workspace = 'desk';
      }else{
         url = "/web" + this.pathname;
         this.workspace = 'web';
         this.action ??= 'view';
      }

      (url || "").split("/").forEach((prop, index) => {
         this[this.#route_structure[index]] = `${decodeURIComponent(this.#route_structure[index] === 'document' ? Capitalize(prop) : prop || "")}`;
      });

      /**Because user can not navigate in auth workspace if is logged in**/
      if (this.workspace === "auth" && loopar.isLoggedIn() && this.action !== "logout"){
         //return this.res.redirect('/desk');
      }

      this.#make_controller();
   }

   #make_controller() {
      this.controller = "base-controller";
      /**
       * When workspace is desk and module view is called from sidebar
       * example: /desk/core or /desk/auth
       * */
      if (!this.document) {
         this.document_name = this.module; /*Because Module called is a document_name on Module Document*/
         this.module = 'core'; /*because Module document is in core module*/
         this.document = 'Module'; /*Because Module is a document*/
         this.action = 'view';
      }

      const res = this.res;

      /**When database is not initialized */
      if (!loopar.database_server_initialized) {
         this.controller = 'installer-controller';

         if (this.document !== 'Installer' || this.action !== 'connect') {
            return res.redirect('/loopar/installer/connect');
         } else {
            this.module = "loopar";
            this.document = "Installer";
            this.action = "connect";
         }
      } else if (!loopar.database_initialized || !loopar.framework_installed) {
         this.controller = 'installer-controller';

         if (this.document !== 'Installer' || this.action !== 'install') {
            return res.redirect('/loopar/installer/install');
         } else {
            this.module = "loopar";
            this.document = "Installer";
            this.app_name = "loopar";
            this.action = "install";
         }
      }else{
         if(this.client === "installer"){
            return this.res.redirect('/desk');
         }
      }

      this.method = this.req.method;
      this.#import_controller();
   }

   async #import_controller() {
      /**TODO: Check controllers */
      await this.#make();

      const importer_controller = await file_manage.import_file(this.controller_path_file);
      const controller = new importer_controller.default({...this, ...this.req.query, router: this});
      this.action = this.action && this.action.length > 0 ? this.action : controller.default_action;
      controller.client = this.client || (["update", "create"].includes(this.action) ? "form" : this.action);
      global.current_controller = controller;

      const action = `action_${this.action}`;

      const send_action = () => {
         controller[controller[action] && typeof controller[action] === "function" ? action : "not_found"]();
      }

      if (this.controller === 'installer-controller' || this.debugger || this.workspace === "web") {
         send_action();
      } else {
         controller.isAuthenticated().then(authenticated => {
            if(!authenticated && !controller.is_login_action){
               return controller.not_found();
            }
            if(!this.exist_controller && !this.api_request){
               return controller.not_found();
            }

            authenticated && controller.isAuthorized().then(authorized => {
               authorized && send_action();
            });
         });
      }
   }

   async temporary_login() {
      return new Promise(resolve => {
        loopar.session.set('user', {
            name: "Administrator",
            email: "mail@mail.com",
            avatar: "AD",
            profile_picture: "",
         }, resolve());
      });
   }

   async #make() {
      await this.#set_app_name();
      await this.#set_app_route();
      await this.#set_controller_name();
      await this.#set_module_path();
      await this.#set_controller_path();

      this.controller_path_file = loopar.makePath(this.controller_path, `${this.controller_name}-controller.js`);

      this.exist_controller = await file_manage.exist_file(this.controller_path_file) && await loopar.db._count("Document", {name: this.document});
      this.controller_path_file = this.exist_controller ? this.controller_path_file : `./${loopar.makePath('controller', this.controller)}.js`;
   }

   async #set_app_name() {
      if(this.controller === 'installer-controller'){
         this.app_name = null;
      }else {
         const module = await loopar.db.get_value("Document", "module", this.document);
         if(module) this.module = module;
         this.app_name = (await loopar.db.get_value("Module", "app_name", module));
         //this.app_type = await loopar.db.get_value("App", "type", this.app_name);
      }
   }

   async #set_app_route() {
      this.app_route = (this.controller === 'installer-controller' ? '' : loopar.makePath("apps", this.app_name || "loopar"));
   }

   async #set_controller_name() {
      this.controller_name = this.controller === 'installer-controller' ? 'installer' : this.document;
   }

   async #set_module_path() {
      this.module_path = loopar.makePath(this.app_route, "modules", this.module);
   }

   async #set_controller_path() {
      this.controller_path = loopar.makePath(this.module_path, this.controller_name);
   }
}