'use strict'

import Installer from "../../modules/core/installer/installer.js";
import BaseController from "./base-controller.js";
import {loopar} from "../loopar.js";


export default class InstallerController extends BaseController {
   constructor(props) {
      super(props);
   }

   async action_connect() {
      const model = new Installer();

      if (this.has_data()) {
         Object.assign(model, this.data);

         if (await model.connect()) {
            this.res.redirect('/desk');
         }
      } else {
         const response = await model.__data_connect__();
         await this.render(response);
      }
   }

   async action_install() {
      const model = new Installer();

      if (this.has_data()) {
         Object.assign(model, this.data);

         if(loopar.framework_installed && await loopar.app_status(model.app_name) === 'installed') {
            loopar.throw("App already installed please refresh page");
         }

         const install = await model.install();
         if (install) {
            await loopar.make_config();
            return this.success("App installed successfully");
         }
      } else {
         const response = await model.__data_install__();
         return await this.render(response);
      }
   }

   async action_reinstall() {
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

   async action_pull(){
      const model = new Installer();

      Object.assign(model, {app_name: this.data.app_name});

      if (await model.pull()) {
         return await this.render({success: true, data: 'App updated successfully'});
      }
   }

   async action_uninstall() {
      const app_name = this.data.app_name;
      loopar.installing = true;

      if(app_name === "loopar") {
         loopar.throw("You can't uninstall app Loopar");
      }

      if(await loopar.app_status(app_name) === 'uninstalled') {
         loopar.throw("App already uninstalled please refresh page");
      }

      await loopar.delete_document("App", app_name, false);

      const modules = await loopar.get_list("Module",
      {
         fields: ['name'],
         filters: {'=': {app_name}}
      });

      for(const module of modules.rows) {
         await loopar.delete_document("Module", module.name, false);

         const documents = await loopar.get_list("Document",
         {
            fields: ['name'],
            filters: {'=': {module: module.name}}
         });

         for(const document of documents.rows) {
            setTimeout(async () => {
               await loopar.delete_document("Document", document.name, false);
            }, 0);
            //await loopar.delete_document("Document", document.name, false);
         }
      }

      await loopar.make_config();

      return this.success('App uninstalled successfully');
   }
}