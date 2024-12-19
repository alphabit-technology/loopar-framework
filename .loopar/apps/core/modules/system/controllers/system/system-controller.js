'use strict'

import { loopar, fileManage, BaseController } from "loopar";

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
        return this.redirect('/desk');
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
    return await loopar.newDocument("Installer", { ...this.data, app_name: this.app_name });
  }

  async actionInstall(reinstall = false) {
    if (this.hasData()) {
      const model = await this.getInstallerModel();
      model.app_name ??= this.getAppName();

      if (loopar.__installed__ && await loopar.appStatus(model.app_name) === 'installed' && !reinstall) {
        loopar.throw("App already installed please refresh page");
      }

      await model.install(reinstall);
      return new Promise(resolve => {
        setTimeout(() => {
          resolve(this.redirect('view'));
        }, 1000);
      });  
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
    return await this.actionInstall(true);
  }

  async actionPull() {
    const model = await this.getInstallerModel();

    Object.assign(model, { app_name: this.data.app_name });

    if (await model.pull()) {
      return await this.render({ success: true, data: 'App updated successfully' });
    }
  }

  async actionUninstall() {
    const app = await loopar.getDocument("App", this.data.app_name);
    await app.unInstall();
    return this.redirect('view');  
  }
}