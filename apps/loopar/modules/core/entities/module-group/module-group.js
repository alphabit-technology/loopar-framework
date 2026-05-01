'use strict';

import { BaseDocument, loopar } from 'loopar';
import path from "path";

export default class ModuleGroup extends BaseDocument {
  constructor(props) {
    super(props);
  }

  async save() {
    await super.save();
  }

  app_path() {
    return path.join('apps/loopar');
  }
}