'use strict'

import BaseController from './base-controller.js';

export default class SingleController extends BaseController {
   constructor(props) {
      super(props);

      this.action === 'list' && this.redirect('update');
   }
}