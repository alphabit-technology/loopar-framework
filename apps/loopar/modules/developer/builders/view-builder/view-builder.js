
'use strict';

import Builder from '../../../../../loopar/modules/core/entities/entity/entity.js';
import { loopar } from "loopar";

export default class ViewBuilder extends Builder {
  constructor(props) {
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module, "views");
  }
}