'use strict'

import Installer from "../../modules/core/entities/installer/installer.js";
import BaseController from "./base-controller.js";
import { loopar } from "../loopar.js";


export default class CoreInstallerController extends BaseController {
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

  async actionInstall() {
    const model = new Installer();

    if (this.hasData()) {
      Object.assign(model, this.data);

      if (loopar.__installed__ && await loopar.appStatus(model.app_name) === 'installed') {
        loopar.throw("App already installed please refresh page");
      }

      const install = await model.install();
      if (install) {
        await loopar.build
        return this.success("App installed successfully");
      }
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
        await lloopar.build
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