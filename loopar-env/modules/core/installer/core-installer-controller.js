'use strict'

import Installer from "../../modules/core/installer/installer.js";
import BaseController from "./base-controller.js";
import { loopar } from "../loopar.js";


export default class CoreInstallerController extends BaseController {
   constructor(props) {
      super(props);
   }

   async actionConnect() {
      const model = new Installer();

      if (this.has_data()) {
         Object.assign(model, this.data);

         if (await model.connect()) {
            this.res.redirect('/desk');
         }
      } else {
         const response = await model.__dataConnect__();
         await this.render(response);
      }
   }

   async actionInstall() {
      const model = new Installer();

      if (this.hasData()) {
         Object.assign(model, this.data);

         if (loopar.frameworkInstalled && await loopar.appStatus(model.app_name) === 'installed') {
            loopar.throw("App already installed please refresh page");
         }

         const install = await model.install();
         if (install) {
            await loopar.makeConfig();
            return this.success("App installed successfully");
         }
      } else {
         const response = await model.__dataInstall__();
         return await this.render(response);
      }
   }

   async actionReinstall() {
      const model = new Installer();

      if (this.has_data()) {
         Object.assign(model, this.data);

         if (await model.update()) {
            await loopar.make_config();
            return this.success("App updated successfully");
         }
      } else {
         const response = await model.__data_install__();
         await this.render(response);
      }
   }

   async actionPull() {
      const model = new Installer();

      Object.assign(model, { app_name: this.data.app_name });

      if (await model.pull()) {
         return await this.render({ success: true, data: 'App updated successfully' });
      }
   }

   async actionUninstall() {
      const app_name = this.data.app_name;
      loopar.installing = true;

      if (app_name === "loopar") {
         loopar.throw("You can't uninstall app Loopar");
      }

      if (await loopar.appStatus(app_name) === 'uninstalled') {
         loopar.throw("App already uninstalled please refresh page");
      }

      await loopar.deleteDocument("App", app_name, false);

      const modules = await loopar.getList("Module",
         {
            fields: ['name'],
            filters: { '=': { app_name } }
         });

      for (const module of modules.rows) {
         await loopar.deleteDocument("Module", module.name, false);

         const documents = await loopar.getList("Document",
            {
               fields: ['name'],
               filters: { '=': { module: module.name } }
            });

         for (const document of documents.rows) {
            setTimeout(async () => {
               await loopar.deleteDocument("Document", document.name, false);
            }, 0);
            //await loopar.delete_document("Document", document.name, false);
         }
      }

      await loopar.makeConfig();

      return this.success('App uninstalled successfully');
   }
}