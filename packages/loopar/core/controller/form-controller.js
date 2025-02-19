'use strict'

import BaseController from './base-controller.js';
import { loopar } from "loopar";

export default class FormController extends BaseController {
   constructor(props) {
      super(props);

      this.action !== 'view' && this.redirect('view');
   }

  async actionView() {
    const document = await loopar.getDocument(this.document, this.name);
    return await this.render(document);
  }
}