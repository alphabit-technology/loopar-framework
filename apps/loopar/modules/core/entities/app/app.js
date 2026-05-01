'use strict';

import { BaseDocument, fileManage, loopar } from 'loopar';
import { buildInstaller } from './builder.js';


export default class App extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save(makeStructure = true) {
    const args = arguments[0] || {};
    const isNew = this.__IS_NEW__;
    if (isNew && this.git_repo && !["null", "undefined"].includes(this.git_repo)) {
      loopar.validateGitRepository(this.git_repo);

      const app_name = this.git_repo.split('/').pop().replace('.git', '');
      const appStatus = await loopar.appStatus(app_name);

      if (fileManage.existFileSync(loopar.makePath('apps', app_name))) {
        if (appStatus === 'installer')
          loopar.throw('App already exists, update or install it in <a href="/developer/App%20Manager/view">App Manage</a>');
        else
          await super.save(args);
      } else {
        await loopar.git(app_name).clone(this.git_repo).then(async () => {
          const appData = fileManage.getAppData(app_name);

          if (!appData || !appData.DeskWorkspace || !appData.DeskWorkspace[app_name]) {
            loopar.throw('Invalid App Structure');
            return;
          }

          const dataInfo = appData.DeskWorkspace[app_name];

          this.name = app_name;
          this.autor = dataInfo.autor;
          this.version = dataInfo.version;
          this.description = dataInfo.description;
          this.git_repo = dataInfo.git_repo;
          this.app_info = dataInfo.app_info;

          await super.save(args);
        });
      }
    } else {
      this.autor = !this.autor || this.autor === '' ? loopar.currentUser.email : this.autor;
      this.version = !this.version || this.version === '' ? '0.0.1' : this.version;
      await super.save(args);
      makeStructure && await this.makeAppStructure();
    }

    isNew && loopar.setApp({[this.name]: this.version})
    
    await loopar.build();

    return true;
  }

  async makeAppStructure() {
    if (loopar.installing) return;

    await fileManage.makeFolder(loopar.makePath('apps', this.name), 'modules');
    await fileManage.makeFolder(loopar.makePath('apps', this.name), 'public', 'uploads', 'thumbnails');

    if (!await loopar.db.count('Module', this.name)) {
      const newModule = await loopar.newDocument('Module', {
        name: this.name,
        description: this.name,
        module_group: 'modules',
        app_name: this.name,
        icon: this.icon,
        in_sidebar: 1
      });

      await newModule.save();
    }

    await fileManage.makeClass(loopar.makePath('apps', this.name), 'installer', {
      IMPORTS: {
        CoreInstaller: 'loopar'
      },
      EXTENDS: 'CoreInstaller',
    });

    this.__IS_NEW__ = false;
    await this.bump('patch');
  }

  async bump(type) {
    const version = this.version.split('.');
    
    switch(type) {
      case 'major':
        version[0] = parseInt(version[0]) + 1;
        version[1] = 0;
        version[2] = 0;
        break;
      case 'minor':
        version[1] = parseInt(version[1]) + 1;
        version[2] = 0;
        break;
      case 'patch':
        version[2] = parseInt(version[2]) + 1;
        break;
    }
    
    this.version = version.join('.');
    await this.save(false);
    await this.buildInstaller()
    
    return true;
  }

  async buildInstaller(){
    await buildInstaller({app: this.name, version: this.version});
  }

  async setOnInstall() {
    await fileManage.setConfigFile('installed-apps', {
      ...fileManage.getConfigFile('installed-apps'),
      [this.name]: this.version
    });

    return true;
  }

  async unInstall() {
    await loopar.unInstallApp(this.name);
    const installedApps = fileManage.getConfigFile('installed-apps');
    delete installedApps[this.name];
    fileManage.setConfigFile('installed-apps', installedApps);
    return await loopar.build();
  }
}