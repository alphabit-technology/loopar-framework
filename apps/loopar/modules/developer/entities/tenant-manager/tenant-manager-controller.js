
'use strict';

import {BaseController} from 'loopar';
import {loopar} from 'loopar';
import {getTenant, tenantList} from "./tenant-manager.js";

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