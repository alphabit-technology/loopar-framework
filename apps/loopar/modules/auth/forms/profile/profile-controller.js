
'use strict';

import {PageController, loopar} from 'loopar';

export default class ProfileController extends PageController {
  static freeActions = ["view", "setInfo", "changePassword"]
  constructor(props){
    super(props);

    const user = loopar.auth.user();

    if(!user) loopar.throw("Not logued", "/auth/login")
  }

  async actionView(){
    this.client = "profile"
    const user = await loopar.newDocument("Profile")

    return await super.render(user)
  }

  clientImporter(Document) {
    return "profile-form"
  }

  async actionUpdateInfo(){
    const profile = await loopar.newDocument("Profile");
    await profile.updateInfo(this.body)

    return this.success("Completed")
  }

  async publicActionUpdate(){
    return await super.actionUpdate(...arguments)
  }

  async actionChangePassword(){
    const profile = await loopar.newDocument("Profile");
    await profile.changePassword(this.body);

    return this.success("Completed")
  }
}