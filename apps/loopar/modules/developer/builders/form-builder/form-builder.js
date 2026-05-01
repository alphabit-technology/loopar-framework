
'use strict';

import { Entity } from '../../../../../loopar/modules/core/entities/entity/entity.js';
import { loopar } from "loopar";

export default class FormBuilder extends Entity {
  constructor(props) {
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps", this.__APP__, "modules", this.module, "forms");
  }
}