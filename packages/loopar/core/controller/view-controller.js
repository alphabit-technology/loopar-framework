'use strict'

import BaseController from './base-controller.js';

export default class SingleController extends BaseController {
   client="view";
   static actionsEnabled=["view"]
   constructor(props) {
      super(props);

      this.action !== 'view' && this.redirect('view');
   }
}