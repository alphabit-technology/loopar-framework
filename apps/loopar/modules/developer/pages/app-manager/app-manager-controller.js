
'use strict';

import { SystemController, loopar, fileManage } from 'loopar';
import fs from "fs";
import path from 'path';

import { pullApp, pushApp, commitApp, discardApp, publishApp, statusApp, getDiff, getRemoteUrl, getCwdForApp } from './git-actions.js';
import { enqueueBuild, setEmitter } from '../../build-service.js';

setEmitter((event, payload) => loopar.emit(event, payload));

export default class AppManagerController extends SystemController {
  constructor(props) {
    super(props);

    this.action !== 'view' && this.method === 'GET' && this.redirect('view');
  }

  redirect(route = '/desk/App Manager/view') {
    return super.redirect(route);
  }

  async actionView() {
    this.client = "view";
    const appsList = [];
    const apps = await loopar.getList('App', { fields: ["*"] });
    const dir = await fs.promises.opendir(loopar.makePath(loopar.pathRoot, "apps"));

    for await (const dirent of dir) {
      if (fs.lstatSync(path.resolve(loopar.makePath(loopar.pathRoot, "apps", dirent.name))).isDirectory()) {
        const installerData = fileManage.getConfigFile('installer', loopar.makePath("apps", dirent.name), []);

        const app = installerData.App;

        if (app) {
          const installedApp = await loopar.getApp(app.name);

          app.installed = !!installedApp;
          app.version ??= '0.0.1';
          app.installed_version = installedApp ? installedApp.version : app.version;
          app.valid_repo = loopar.gitRepositoryIsValid(app.git_repo);

          const ownGitPath = loopar.makePath(loopar.pathRoot, 'apps', dirent.name, '.git');
          app.has_git = fs.existsSync(ownGitPath);
          app.is_framework = (app.name === 'loopar' && !app.has_git);

          appsList.push(app);
        }
      }
    }

    await Promise.all(appsList.map(async (app) => {
      if (!app.has_git && !app.is_framework) {
        app.remote_url = '';
        app.repo_status = null;
        return;
      }
      try {
        const liveUrl = await getRemoteUrl(app.name);
        app.remote_url = liveUrl || app.git_repo || '';
      } catch {
        app.remote_url = app.git_repo || '';
      }
      try {
        app.repo_status = await statusApp(app.name);
      } catch {
        app.repo_status = null;
      }
    }));

    if(this.preloaded == 'true') {
      return {
        instance: this.getInstance(),
        rows: appsList
      }
    }

    //apps.rows = appsList;

    apps.Entity.name = "App Manager";


    return await this.render(apps, {rows: appsList});
  }

  async actionClone() {
    const { git_repo } = this.body || {};

    const model = await loopar.newDocument('App Manager');
    Object.assign(model, { git_repo });

    if (await model.clone()) {
      return this.redirect();
    }
  }

  async actionPull() {
    const app_name = this.#requireAppName();
    const result = await pullApp(app_name);

    if (!result.success) {
      return await this.success(result, {
        notify: { type: 'error', message: result.message }
      });
    }

    const restartNote = result.needs_restart
      ? ' Restart the tenant (nodemon will reload in dev) to apply.'
      : '';
    const changesNote = result.files_changed
      ? ` ${result.files_changed} file(s) changed.`
      : ' Already up to date.';

    let buildNote = '';
    const buildOnPull = !['0', 'false'].includes(String(process.env.LOOPAR_BUILD_ON_PULL ?? '1'));
    const changed = result.files_changed > 0 || result.needs_restart;

    if (buildOnPull && changed) {
      const q = enqueueBuild({
        scope: 'all',
        cwd: loopar.pathRoot,
        initiator: loopar.tenantId,
      });
      result.build_queued = q.queued;
      buildNote = q.queued
        ? ' Full build started.'
        : ' A build is already in progress.';
    }

    return await this.success(result, {
      notify: {
        type: 'success',
        message: `Pulled ${app_name}.${changesNote}${restartNote}${buildNote}`
      }
    });
  }

  async actionPush() {
    const app_name = this.#requireAppName();
    const result = await pushApp(app_name);

    if (!result.success) {
      return await this.success(result, {
        notify: { type: 'error', message: result.message }
      });
    }

    return await this.success(result, {
      notify: {
        type: 'success',
        message: `Pushed ${app_name} (${result.pushed} commit${result.pushed === 1 ? '' : 's'}).`
      }
    });
  }

  async actionCommit() {
    const app_name = this.#requireAppName();
    const message = (this.body && this.body.message) || (this.query && this.query.message);

    if (!message || !message.trim()) {
      return await this.success(
        { success: false, reason: 'NO_MESSAGE', message: 'Commit message is required.' },
        { notify: { type: 'error', message: 'Commit message is required.' } }
      );
    }

    const result = await commitApp(app_name, message);

    if (!result.success) {
      return await this.success(result, {
        notify: { type: 'error', message: result.message }
      });
    }

    return await this.success(result, {
      notify: {
        type: 'success',
        message: `Committed ${app_name} (${result.files_committed} file${result.files_committed === 1 ? '' : 's'}). Push when ready.`
      }
    });
  }


  async actionDiscard() {
    const app_name = this.#requireAppName();
    const result = await discardApp(app_name);

    if (!result.success) {
      return await this.success(result, {
        notify: { type: 'error', message: result.message }
      });
    }

    await this.unInstallApp(app_name, {}, true);

    return await this.success(result, {
      notify: { type: 'warning', message: result.message }
    });
  }

  async actionPublish() {
    const app_name = this.#requireAppName();
    const remote_url = (this.body && this.body.remote_url) || (this.query && this.query.remote_url);
    const message = (this.body && this.body.message) || (this.query && this.query.message) || 'Initial commit';

    if (!remote_url || !remote_url.trim()) {
      return await this.success(
        { success: false, reason: 'NO_URL', message: 'Remote URL is required.' },
        { notify: { type: 'error', message: 'Remote URL is required.' } }
      );
    }

    const result = await publishApp(app_name, remote_url, message);

    if (!result.success) {
      return await this.success(result, {
        notify: { type: 'error', message: result.message }
      });
    }

    return await this.success(result, {
      notify: {
        type: 'success',
        message: `Published ${app_name} → ${result.remote_url} (${result.branch}).`
      }
    });
  }

  async actionDiff() {
    const app_name = this.#requireAppName();
    try {
      return await getDiff(app_name);
    } catch (e) {
      return { success: false, message: e.message || 'Diff failed' };
    }
  }

  async actionStatus() {
    const app_name = this.#requireAppName();
    try {
      return await statusApp(app_name);
    } catch (e) {
      return { success: false, reason: e.code || 'ERROR', message: e.message };
    }
  }

  #requireAppName() {
    const app_name = (this.body && this.body.app_name) || (this.query && this.query.app_name);
    if (!app_name) loopar.throw("app_name is required");
    return app_name;
  }
}
