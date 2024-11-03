'use strict'

import BaseController from "../../../../../../core/controller/base-controller.js";
import { loopar, fileManage } from "loopar";

export default class SystemController extends BaseController {
  client = "form";
  constructor(props) {
    super(props);
  }

  async actionConnect() {
    const model = await loopar.newDocument("Connector", this.data);

    if (this.hasData()) {
      //Object.assign(model, this.data);

      if (await model.connect()) {
        return this.res.redirect('/desk');
      }
    } else {
      const response = await model.__data__();
      response.__DOCUMENT__ = {
        dialect: "mysql",
        host: "localhost",
        port: "3306",
        user: "root",
        password: "root",
        tyme_zone: "+00:00",
      }
      return await this.render(response);
    }
  }

  getAppName() {
    return this.app_name || "loopar";
  }

  async getInstallerModel() {
    const installerRoute = loopar.makePath('apps', this.getAppName(), 'installer.js')

    const Installer = await fileManage.importClass(installerRoute, false);

    if (Installer) return new Installer(this.data);
    return await loopar.newDocument("Installer", this.data);
  }

  async actionInstall() {
    if (this.hasData()) {
      const model = await this.getInstallerModel();
      Object.assign(model, this.data);

      if (loopar.__installed__ && await loopar.appStatus(model.app_name) === 'installed') {
        loopar.throw("App already installed please refresh page");
      }

      await model.install();
      return this.success("App installed successfully");
    } else {
      const model = await loopar.newDocument("Installer", this.data)
      const response = await model.__data__();

      response.__DOCUMENT__ = {
        company: "AlphaBit Technology Test123",
        email: "alfredrz2012@gmail.com",
        admin_password: "admin",
        confirm_password: "admin",
      }

      return await this.render(response);
    }
  }

  async actionReinstall() {
    const model = new Installer();

    if (this.hasData()) {
      Object.assign(model, this.data);

      if (await model.update()) {
        //await lloopar.build
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
    const app = await loopar.getDocument("App", this.data.app_name);
    return this.success(await app.unInstall());
  }
}