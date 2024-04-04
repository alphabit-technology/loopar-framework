'use strict'

import Installer from "../../modules/core/installer/core-installer.js";
import BaseController from "./base-controller.js";
import { loopar } from "../loopar.js";
import { fileManage } from "../file-manage.js";


export default class InstallerController extends BaseController {
  constructor(props) {
    super(props);
  }

  async actionConnect() {
    const model = new Installer();

    if (this.hasData()) {
      Object.assign(model, this.data);

      if (await model.connect()) {
        this.res.redirect('/desk');
      }
    } else {
      const response = await model.__dataConnect__();
      await this.render(response);
    }
  }

  getAppName() {
    return this.app_name || null;
  }

  async getInstallerModel() {
    const installerRoute = loopar.makePath('apps', this.getAppName(), 'installer.js');

    return await fileManage.importClass(installerRoute, Installer);
  }

  async actionInstall() {
    const installerModel = await this.getInstallerModel();
    const model = new installerModel(this.data);

    if (this.hasData()) {
      if (loopar.frameworkInstalled && await loopar.appStatus(model.app_name) === 'installed') {
        loopar.throw("App already installed please refresh page");
      }

      return this.success(await model.install());
      /*const install = await model.install();
      if (install) {
         await loopar.makeConfig();
         return this.success("App installed successfully");
      }*/
    } else {
      const response = await model.__dataInstall__();
      return await this.render(response);
    }
  }

  async actionReinstall() {
    const model = new Installer();

    if (this.hasData()) {
      Object.assign(model, this.data);

      if (await model.update()) {
        await loopar.makeConfig();
        return this.success("App updated successfully");
      }
    } else {
      const response = await model.__dataInstall__();
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
    const appStatus = await loopar.appStatus(this.data.app_name);

    if (appStatus === 'uninstalled') {
      loopar.throw(`App ${this.data.app_name} is not installed, please refresh page.`);
    }

    const app = await loopar.getDocument("App", this.data.app_name);
    return this.success(await app.unInstall());
  }
}