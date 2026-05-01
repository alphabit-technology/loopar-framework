'use strict'

import { BaseDocument, fileManage, loopar } from "loopar";

export default class Module extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save(arguments[0] || {});
    await this.makeModuleRoute();
    await loopar.build();
  }

  appPath() {
    return loopar.makePath('apps', this.app_name);
  }

  modulePath() {
    return loopar.makePath(this.appPath(), 'modules');
  }

  async makeModuleRoute() {
    await fileManage.makeFolder(this.modulePath(), this.name.replaceAll(/\s+/g, '-').toLowerCase());
  }
}