'use strict';

import { loopar, BaseController } from 'loopar';

export default class AppController extends BaseController {
   constructor(props) {
      super(props);
   }

  async actionIncrementPatch() {
    return await this.#execute('patch');
  }

  async actionIncrementMinor() {
    return await this.#execute('minor');
  }

  async actionIncrementMajor() {
    return await this.#execute('major');
  }

  async #execute(type){
    const model = await loopar.getDocument("App", this.name);
    if (model.bump && await model.bump(type)) {
      return await this.success(
        {version: model.version},
        {
          notify: { type: "success", message: `App ${model.name} update to new version: ${model.version}` }
        }
      );
    }
  }
}