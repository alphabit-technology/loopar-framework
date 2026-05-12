'use strict'

import { loopar, fileManage, BaseController } from "loopar";

export default class SystemController extends BaseController {
  client = "form";
  static publicActions = ['connect', 'install', 'update', 'reinstall'];

  constructor(props) {
    super(props);
  }

  redirect(route = '/auth/login', opts = {}) {
    return super.redirect(route, { hard: true, ...opts });
  }

  async publicActionConnect() {
    const model = await loopar.newDocument("Connector", this.data);

    if (this.hasData()) {
      if (await model.connect()) {
        return this.redirect('/desk');
      }
    } else {
      const response = await model.__meta__();
      
      response.data = {
        dialect: "mysql",
        host: "localhost",
        port: "3306",
        user: "root",
        password: "root",
        time_zone: "+00:00",
      }

      return await this.render(response);
    }
  }

  getAppName() {
    return this.app_name || "loopar";
  }

  async getInstallerModel(appName, data = {}) {
    const installerRoute = loopar.makePath('apps',appName || this.getAppName(), 'installer.js')

    const Installer = await fileManage.importClass(installerRoute, false);

    if (Installer) return new Installer(this.data);
    return await loopar.newDocument("Installer", { ...(data || this.data), app_name: appName || this.app_name });
  }

  async unInstallApp(appName, data = {}, reinstall = false) {
    const model = await this.getInstallerModel(appName, data);
    model.app_name ??= appName || this.getAppName();
    
    if (loopar.__installed__ && await loopar.appStatus(model.app_name) === 'installed' && !reinstall) {
      loopar.throw("App already installed please refresh page");
    }

    await model.install(reinstall);
  }

  async publicActionInstall(reinstall = false) {
    if (this.hasData()) {
      await this.unInstallApp(this.getAppName(), this.data, reinstall);
      return this.redirect("view");
    } else {
      const model = await loopar.newDocument("Installer", this.data)
      const response = await model.__meta__();

      return await this.render(response);
    }
  }

  async publicActionUpdate() {
    if (this.app_name) {
      const model = await this.getInstallerModel();
      model.app_name ??= this.getAppName();

      await model.install(true);
      return this.redirect();
    } else {
      const model = await loopar.newDocument("Update", this.data)
      const response = await model.__meta__();

      return await this.render(response);
    }
  }

  async actionReinstall() {
    return await this.publicActionInstall(true);
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
    return this.refresh('view');  
  }
}