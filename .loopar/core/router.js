'use strict';
import { loopar } from './loopar.js';
import { fileManage } from "./file-manage.js";
import multer from "multer";
import BaseController from './controller/base-controller.js';

const coreInstallerController = 'installer-controller';


export default class Router {
  controller = 'base-controller';
  debugger = false;
  lastController = null;

  constructor(options) {
    Object.assign(this, options);

    this.uploader = multer({ storage: multer.memoryStorage() }).any();
  }

  #isAssetUrl(url) {
    url = Array.isArray(url) ? url[0] : url;
    if (url.includes("@") || url.includes("jsx")) return true;

    url = url.split("?");
    const baseUrl = url[0].split("/");
    const source = baseUrl[baseUrl.length - 1];

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
    const loadHttp = async (req, res) => {
      loopar.req = req;
      loopar.res = res;
      loopar.cookie.res = res;
      loopar.cookie.cookies = req.cookies;

      if (req.files && req.files.length > 0) {
        req.body.reqUploadFiles = req.files;
      }

      this.#makeWorkspace({ req, res });
    }

    this.server.use((req, res, next) => {
      loopar.session.req = req;

      if (this.#isAssetUrl(req._parsedUrl.pathname)) {
        next();
      } else {
        loopar.transactionError = false;
        if (req.headers['content-type'] && req.headers['content-type'].startsWith('multipart/form-data')) {
          this.uploader(req, res, err => {
            if (err instanceof multer.MulterError) {
              console.log('A Multer error is detected', err);
              //return res.status(500).json({error: err.message});
            } else if (err) {
              //console.log('Error', err);
              return res.status(500).json({ error: err.message });
            }
            loadHttp(req, res);
          });
        } else {
          loadHttp(req, res);
        }
      }
    });

    this.server.use(this.#custom404Middleware);
  }

  async #makeWorkspace() {
    const args = arguments[0];
    const { req, res } = args;
    const pathname = req._parsedUrl.pathname//.replace('web/', '');

    const context = pathname.split("/")[1];
    const reqWorkspace = ['desk', 'auth', 'api', 'loopar'].includes(context) ? context : 'web';
    const routeStructure = { host: null, module: null, document: null, action: null };
    const controllerParams = { req, res, dictUrl: req._parsedUrl, pathname, url: pathname, controller: "base-controller"}

    if (reqWorkspace === "loopar") {
      controllerParams.workspace = 'auth';
      controllerParams.client = 'installer';
    } else if (reqWorkspace === "api") {
      controllerParams.url = "/desk" + pathname.split("api")[1];
      controllerParams.workspace = 'desk';
      controllerParams.apiRequest = true;
    } else if (reqWorkspace === 'auth') {
      controllerParams.url = "/auth" + pathname.split("auth")[1];
      controllerParams.workspace = 'auth';
    } else if (reqWorkspace === 'desk') {
      controllerParams.url = pathname.split("desk")[1];
      controllerParams.workspace = 'desk';
    } else {
      controllerParams.url = "/web" + pathname;
      controllerParams.workspace = 'web';
      controllerParams.action ??= 'view';
      controllerParams.context = "web"
    }

    if(reqWorkspace === "web"){
      const [host, document,action] = controllerParams.url.split("/").filter(Boolean);
      routeStructure.module = "web";
      routeStructure.document = document;
      routeStructure.action = action || "view";
      controllerParams.action = routeStructure.action;
    }else{
      (controllerParams.url || "").split("/").forEach((seg, index) => {
        const RTK = Object.keys(routeStructure)[index];
        routeStructure[RTK] = `${decodeURIComponent(RTK === 'document' ? loopar.utils.Capitalize(seg) : seg || "")}`;
      });
    }
    if (reqWorkspace === "web" && routeStructure.document === "Undefined") {
      routeStructure.document = "Home";
    }

    /**Because user can not navigate in auth workspace if is logged in**/
    if (controllerParams.workspace === "auth" && loopar.isLoggedIn() && controllerParams.action !== "logout") {
      //return this.res.redirect('/desk');
    }

    if (reqWorkspace === "web" && loopar.frameworkInstalled && loopar.databaseServerInitialized && loopar.databaseInitialized) {
      const webApp = loopar.webApp || {menu_items: []};
      routeStructure.document ??= "Home";
      const menu = webApp.menu_items.find(item => item.link === routeStructure.document);
      
      if(!webApp.name || !menu) {
        Object.assign(routeStructure, {
          module: "core",
          document: "Error",
          action: "view",
          code: 404,
          title: !webApp.name ? "Web App not found" : "Page not found",
          description: !webApp.name ? "You don\'t have Install the Web App, please install it first and set as default" : "The page you are looking for does not exist"
        });

        return await this.#makeController({ ...routeStructure, ...controllerParams });
      }else{
        routeStructure.document = menu.page;
      }
    }

    return await this.#makeController({ ...routeStructure, ...controllerParams });
  }

  async #makeController(args) {
    const { res, req } = args;

    /**
     * When workspace is desk and module view is called from sidebar
     * example: /desk/core or /desk/auth
     * */
    if (!args.document) {
      args.documentName = args.module; /*Because Module called is a documentName on Module Document*/
      args.module = 'core'; /*because Module document is in core module*/
      args.document = 'Module'; /*Because Module is a document*/
      args.action = 'view';
    }

    if (!loopar.databaseServerInitialized) {
      /**System detected that Database Server is no Initialized or not Installer */
      args.controller = coreInstallerController;

      if (args.document !== 'Installer' || args.action !== 'connect') {
        /**Forcer to redirect to: */
        return res.redirect('/loopar/installer/connect');
      } else {
        args.module = "loopar";
        args.document = "Installer";
        args.action = "connect";
      }
    } else if (!loopar.databaseInitialized || !loopar.frameworkInstalled) {
      /**System not detected a Database */
      args.controller = coreInstallerController;

      if (args.document !== 'Installer' || args.action !== 'install') {
        /**Force to redirect to: */
        return res.redirect('/loopar/installer/install');
      } else {
        args.module = "loopar";
        args.document = "Installer";
        args.app_name = "loopar";
        args.action = "install";
      }
    } else {
      /**System detected that Database Server is Initialized and have Database */
      if (args.document === "Installer") {
        return res.redirect('/desk');
      }
    }

    args.method = req.method;

    /**
     * Because request method GET is not allowed in API
     */
    if (args.module === "method" && args.method === "GET") {
      return this.#custom404Middleware(req, res);
    }

    return await this.#importController(args);
  }

  sendResponse(res, req, response) {
    try {
      if (response instanceof Error) {
        res.status(500);
        if (req.method === "POST") {
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'POST');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          return res.send(response);
        } else {
          return res.send(response.message);
        }
      } else if (response === undefined) {
        //return this.#custom404Middleware(req, res);
      } else if (response instanceof Object) {
        if (response.status) res.status(response.status);
        if (response.headers) res.set(response.headers);
        if (response.body) return res.send(response.body);

        return res.send(response);
      } else {
        res.status(200);
        res.setHeader('Content-Type', 'content-type: text/html; charset=utf-8');

        return res.send(response);
      }
    } catch (error) {
      console.log(["***************Error", error])
    }
  }

  async launchAction(controller, action, res, req) {
    const response = await controller.sendAction(action);
    this.sendResponse(res, req, response);
  }

  async launchController(controller, args) {
    loopar.lastController = controller;

    args.action = args.action && args.action.length > 0 ? args.action : controller.default_action;
    //controller.client = args.client || (["update", "create"].includes(args.action) ? "form" : args.action);

    await this.temporaryLogin();
    
    if (args.controller === coreInstallerController || this.debugger || args.workspace === "web" || await controller.isAuthenticated() ) {
      this.launchAction(controller, args.action, args.res, args.req);
    }
  }

  async #importController(args) {
    await this.#make(args);
    const { req } = args;
    const props = { ...args, ...req.query, data: req.body };

    const Controller = await fileManage.importClass(args.controllerPathFile, BaseController);
    return await this.launchController(new Controller(props), args);
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

  async #make(args) {
    await this.#setAppName(args);
    await this.#setAppRoute(args);
    await this.#setControllerName(args);
    await this.#setModulePath(args);
    await this.#setControllerPath(args);

    args.controllerPathFile = loopar.makePath(args.controllerPath, `${args.controllerName}Controller.js`);
    args.existController = await fileManage.existFile(args.controllerPathFile) && await loopar.db._count("Document", { name: args.document });
    args.controllerPathFile = args.existController ? args.controllerPathFile : `.${loopar.makePath('controller', args.controller)}.js`;

    /*args.controllerPathFile = loopar.makePath(args.controllerPath, `${args.controllerName}Controller.js`);
    args.existController = await fileManage.existFile(args.controllerPathFile) && await loopar.db._count("Document", { name: args.document });
    args.controllerPath = args.existController ? args.controllerPathFile :  `.${loopar.makePath('controller', args.controller)}.js`;*/
  }

  async #setAppName(args) {
    if (args.controller === coreInstallerController) {
      args.app_name = "loopar";
    } else {
      const module = await loopar.db.getValue("Document", "module", args.document);
      if (module) args.module = module;
      args.app_name = (await loopar.db.getValue("Module", "app_name", module));
    }
  }

  async #setAppRoute(args) {
    args.appRoute = (args.controller === coreInstallerController ? '' : loopar.makePath("apps", args.app_name || "loopar"));
  }

  async #setControllerName(args) {
    args.controllerName = args.controller === coreInstallerController ? 'Installer' : args.document;
  }

  async #setModulePath(args) {
    args.modulePath = loopar.makePath(args.appRoute, "modules", args.module);
  }

  async #setControllerPath(args) {
    args.controllerPath = loopar.makePath(args.modulePath, args.controllerName);
  }
}