'use strict';
import { Capitalize } from './helper.js';
import { loopar } from './loopar.js';
import { fileManage } from "./file-manage.js";
import multer from "multer";

const coreInstallerController = 'installer-controller';

export default class Router {
   #routeStructure = ["host", "module", "document", "action"];
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

   get #isAssetUrl() {
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

         if (req.files && req.files.length > 0) {
            this.data.req_upload_files = req.files;
         }
         this.method = req.method;

         this.#makeWorkspace()
      }

      this.server.use((req, res, next) => {
         this.res = res;
         this.req = req;
         this.url = req._parsedUrl;
         this.pathname = this.url.pathname;

         if (this.#isAssetUrl) {
            next();
         } else {
            if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
               this.uploader(req, res, err => {
                  if (err instanceof multer.MulterError) {
                     console.log('A Multer error is detected', err);
                     //return res.status(500).json({error: err.message});
                  } else if (err) {
                     //console.log('Error', err);
                     return res.status(500).json({ error: err.message });
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

   #makeWorkspace() {
      this.controller = "base-controller";
      this.#routeStructure.forEach(prop => {
         if (prop.toString().length > 0) this[prop] = null;
      });
      this.client = null;

      let url = this.pathname;

      const context = this.url.pathname.split("/")[1];
      const workspace = ['desk', 'auth', 'api', 'loopar'].includes(context) ? context : 'web';

      if (workspace === "loopar") {
         this.workspace = 'auth';
         this.client = 'installer';
      } else if (workspace === "api") {
         url = "/desk" + this.pathname.split("api")[1];
         this.workspace = 'desk';
         this.apiRequest = true;
      } else if (workspace === 'auth') {
         url = "/auth" + this.pathname.split("auth")[1];
         this.workspace = 'auth';
      } else if (workspace === 'desk') {
         url = this.pathname.split("desk")[1];
         this.workspace = 'desk';
      } else {
         url = "/web" + this.pathname;
         this.workspace = 'web';
         this.action ??= 'view';
      }

      (url || "").split("/").forEach((prop, index) => {
         this[this.#routeStructure[index]] = `${decodeURIComponent(this.#routeStructure[index] === 'document' ? Capitalize(prop) : prop || "")}`;
      });

      /**Because user can not navigate in auth workspace if is logged in**/
      if (this.workspace === "auth" && loopar.isLoggedIn() && this.action !== "logout") {
         //return this.res.redirect('/desk');
      }

      this.#makeController();
   }

   #makeController() {
      this.controller = "base-controller";
      /**
       * When workspace is desk and module view is called from sidebar
       * example: /desk/core or /desk/auth
       * */
      if (!this.document) {
         this.documentName = this.module; /*Because Module called is a documentName on Module Document*/
         this.module = 'core'; /*because Module document is in core module*/
         this.document = 'Module'; /*Because Module is a document*/
         this.action = 'view';
      }

      const res = this.res;

      /**When database is not initialized */
      if (!loopar.databaseServerInitialized) {
         this.controller = coreInstallerController;

         if (this.document !== 'Installer' || this.action !== 'connect') {
            return res.redirect('/loopar/installer/connect');
         } else {
            this.module = "loopar";
            this.document = "Installer";
            this.action = "connect";
         }
      } else if (!loopar.databaseInitialized || !loopar.frameworkInstalled) {
         this.controller = coreInstallerController;

         if (this.document !== 'Installer' || this.action !== 'install') {
            return res.redirect('/loopar/installer/install');
         } else {
            console.log("installer");
            this.module = "loopar";
            this.document = "Installer";
            this.appName = "loopar";
            this.action = "install";
         }
      } else {
         if (this.client === "installer") {
            return this.res.redirect('/desk');
         }
      }

      this.method = this.req.method;
      this.#importController();
   }

   async #importController() {
      /**TODO: Check controllers */
      await this.#make();

      const importerController = await fileManage.importFile(this.controllerPathFile);
      const controller = new importerController.default({ ...this, ...this.req.query, router: this });

      this.action = this.action && this.action.length > 0 ? this.action : controller.default_action;
      controller.client = this.client || (["update", "create"].includes(this.action) ? "form" : this.action);
      global.currentController = controller;

      const action = `action${Capitalize(this.action)}`;

      const sendAction = () => {
         controller[controller[action] && typeof controller[action] === "function" ? action : "notFound"](

         );
      }

      if (this.controller === coreInstallerController || this.debugger || this.workspace === "web") {
         sendAction();
      } else {
         await this.temporaryLogin();
         controller.isAuthenticated().then(authenticated => {
            if (!authenticated && !controller.isLoginAction) {
               return controller.not_found();
            }
            if (!this.existController && !this.apiRequest) {
               return controller.not_found();
            }

            authenticated && controller.isAuthorized().then(authorized => {
               authorized && sendAction();
            });
         });
      }
   }

   async temporaryLogin() {
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
      await this.#setAppName();
      await this.#setAppRoute();
      await this.#setControllerName();
      await this.#setModulePath();
      await this.#setControllerPath();

      this.controllerPathFile = loopar.makePath(this.controllerPath, `${this.controllerName}Controller.js`);

      this.existController = await fileManage.existFile(this.controllerPathFile) && await loopar.db._count("Document", { name: this.document });
      this.controllerPathFile = this.existController ? this.controllerPathFile : `./${loopar.makePath('controller', this.controller)}.js`;
   }

   async #setAppName() {
      if (this.controller === coreInstallerController) {
         this.appName = "loopar";
      } else {
         const module = await loopar.db.getValue("Document", "module", this.document);
         if (module) this.module = module;
         this.appName = (await loopar.db.getValue("Module", "app_name", module));
      }
   }

   async #setAppRoute() {
      this.appRoute = (this.controller === coreInstallerController ? '' : loopar.makePath("apps", this.appName || "loopar"));
   }

   async #setControllerName() {
      this.controllerName = this.controller === coreInstallerController ? 'coreInstaller' : this.document;
   }

   async #setModulePath() {
      this.modulePath = loopar.makePath(this.appRoute, "modules", this.module);
   }

   async #setControllerPath() {
      this.controllerPath = loopar.makePath(this.modulePath, this.controllerName);
   }
}