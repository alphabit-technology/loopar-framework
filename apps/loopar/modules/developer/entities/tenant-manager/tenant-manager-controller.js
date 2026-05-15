
'use strict';

import {BaseController} from 'loopar';
import {loopar} from 'loopar';
import {getTenant, tenantList} from "./tenant-manager.js";
import { spawn } from 'child_process';
import crypto from 'node:crypto';

let buildState = { state: 'idle' };
let buildChild = null;

function emitBuildStatus() {
  loopar.emit("buildStatus", { build: buildState });
}

function finalizeBuild(next) {
  if (buildState.state !== 'running') return;
  buildState = { ...buildState, ...next };
  buildChild = null;
  emitBuildStatus();
}

export default class TenantManagerController extends BaseController {
  unRestrictedActions = ["list", "create", "update"]
  constructor(props){
    super(props);
  }

  async beforeAction(){
    const test = await super.beforeAction();

    if(!test || loopar.tenantId != "dev") loopar.throw("Access restricted")
  }

  async getTenant(name=this.name){
    return await getTenant(name);
  }

  async actionList(){
    return super.render(await tenantList());
  }

  async actionCreate(){
    if(!this.hasData()){
      return super.actionCreate();
    }

    const tenant = await loopar.newDocument("Tenant Manager", this.data);
    await tenant.save();
    return this.success("Tenant created successfully");
  }

  async actionUpdate(){
    const tenant = await this.getTenant();
    if(this.hasData()){
      Object.entries(this.body).forEach(([key, value]) => {
        tenant[key] = value;
      });
      await tenant.save();
      return this.success("Tenant updated successfully");
    }else{
      return await this.render(await tenant.__meta__());
    }
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
    if (buildState.state === 'running') {
      return {
        status: 200,
        success: true,
        build: buildState,
        notify: { type: "warning", message: "A build is already in progress." },
      };
    }

    buildState = {
      id: crypto.randomUUID(),
      state: 'running',
      startedAt: Date.now(),
    };
    emitBuildStatus();

    buildChild = spawn('npm', ['run', 'build'], {
      cwd: loopar.pathRoot,
      env: {
        ...process.env,
        NODE_ENV: 'production',
        BUILD_INITIATOR: loopar.tenantId,
        FORCE_COLOR: '0',
        TENANT_ID: undefined,
        TENANT_PATH: undefined,
        PORT: undefined,
        DOMAIN: undefined,
        HMR_PORT: undefined,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    buildChild.stdout.on('data', (chunk) => {
      process.stdout.write(`[build] ${chunk}`);
    });
    buildChild.stderr.on('data', (chunk) => {
      process.stderr.write(`[build] ${chunk}`);
    });

    buildChild.on('exit', (code) => {
      finalizeBuild({
        state: code === 0 ? 'completed' : 'failed',
        finishedAt: Date.now(),
        exitCode: code,
      });
    });

    buildChild.on('error', (err) => {
      finalizeBuild({
        state: 'failed',
        finishedAt: Date.now(),
        error: err.message,
      });
    });

    return {
      status: 200,
      success: true,
      build: buildState,
      notify: { type: "info", message: "Build started — you'll be notified when it finishes." },
    };
  }

  async actionBuildStatus() {
    return {
      status: 200,
      success: true,
      build: buildState,
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