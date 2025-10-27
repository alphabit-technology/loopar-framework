
'use strict';

import { SingleController, loopar } from 'loopar';

export default class ErrorController extends SingleController {
  constructor(props) {
    super(props);
  }

  async actionView() {
    const error = await loopar.newDocument("Error");
    Object.assign(error.data, {
      code: this.code || 500,
      title: this.title,
      message: this.description
    });

    return await this.render(error);
  }
}