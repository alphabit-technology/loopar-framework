
'use strict';

import {BaseController, loopar} from 'loopar';
import { enqueueBuild, getBuildStatus, setEmitter } from '../../build-service.js';

setEmitter((event, payload) => loopar.emit(event, payload));

export default class TenantManagerController extends BaseController {
  unRestrictedActions = ["list", "create", "update"]
  constructor(props){
    super(props);
  }

  async beforeAction(){
    const test = await super.beforeAction();

    const isControlPlane = ["1", "true"].includes(String(process.env.CONTROL_PLANE))
      || ["loopar", "dev", "cloud"].includes(loopar.tenantId);

    if(!test || !isControlPlane) loopar.throw("Access restricted")
  }

  async getTenant(name = this.name) {
    return await loopar.getDocument("Tenant Manager", name, null);
  }

  async actionProduction(){
    return await this.makeAction("setOnProduction");
  }

  async actionDevelopment(){
    return await this.makeAction("setOnDevelopment");
  }

  async actionStart(){
    return await this.makeAction("start");
  }

  async actionStop(){
    return await this.makeAction("stop");
  }

  async actionRestart(){
    return await this.makeAction("restart");
  }

  async actionReload(){
    return await this.makeAction("reload");
  }

  async actionBuild() {
    const scope =
      (this.body && this.body.app) ||
      (this.query && this.query.app) ||
      'all';

    const res = enqueueBuild({
      scope,
      cwd: loopar.pathRoot,
      initiator: loopar.tenantId,
    });

    let type = 'info';
    let message;
    if (res.queued) {
      message = scope === 'all'
        ? "Build started — you'll be notified when it finishes."
        : `Build for "${scope}" queued — you'll be notified when it finishes.`;
    } else {
      type = 'warning';
      message = {
        ALREADY_RUNNING: 'A build is already in progress.',
        ALREADY_QUEUED: `A build for "${scope}" is already queued.`,
        COVERED_BY_FULL: 'A full build is already in progress; it covers this app.',
      }[res.reason] || 'A build is already in progress.';
    }

    return {
      status: 200,
      success: true,
      build: res.build,
      queue: res.queue,
      notify: { type, message },
    };
  }

  async actionBuildStatus() {
    return {
      status: 200,
      success: true,
      ...getBuildStatus(),
    };
  }

  async actionSetOnProduction(){
    return await this.makeAction("setOnProduction");
  }

  async makeAction(action){
    const tenant = await this.getTenant();
    const r = await tenant[action]();

    return this.success(
      r ? `${this.name}.${action} completed successfully` :
        `${this.name}.${action} failed`,
      { 
        notify: { 
          type: r ? ["stop", "restart"].includes(action) ? "warning" : "success" : "error" 
        }
      }
    )
  }
}