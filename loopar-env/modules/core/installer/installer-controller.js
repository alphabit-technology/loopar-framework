/*'use strict'

import Installer from "../../modules/core/installer/installer.js";
import CoreController from "./core-controller.js";
import express from "express";
import path from "path";

export default class InstallerController extends CoreController {
   workspace = "installer";
   default_action = 'install';
   //context = "installer";
   hasSidebar = false;

   constructor(props) {
      super(props);

      this.server.use(express.static(path.join(this.controller_path, "client")));
   }

   async action_connect() {
      const model = new Installer();

      if (this.has_data()) {
         Object.assign(model, this.data);

         if (await model.connect()) {
            return this.render({
               app: "installer",
               message: "Framework installed successfully"
            });
         }
      } else {
         const response = await model.__data_connect__();

         response.app = "form";
         await this.render(response);
      }
   }

   async action_install() {
      const model = new Installer();

      if (this.has_data()) {
         Object.assign(model, this.data);

         if (await model.install()) {
            return this.render({
               app: "installer",
               message: "Framework installed successfully"
            });
         }
      } else {
         const response = await model.__data_install__();

         response.app = "form";
         await this.render(response);
      }
   }
}*/