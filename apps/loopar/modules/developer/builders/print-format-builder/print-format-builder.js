'use strict';

import Builder from '../../../../../loopar/modules/core/entities/entity/entity.js';
import { loopar, fileManage, listPrintFormats } from "loopar";

export default class PrintFormatBuilder extends Builder {
  constructor(props) {
    super(props);
  }

  /** A builder instance without name/module must never touch the filesystem. */
  #hasIdentity() {
    return !!(this.name && this.module);
  }

  async modulePath() {
    return loopar.makePath("apps", await this.targetApp(), "modules", this.module, "print-formats");
  }

  async save() {
    if (!this.#hasIdentity()) {
      console.warn("[Print Format Builder] save skipped: name and module are required.");
      return;
    }

    const ref = this.for_entity && loopar.getRef(this.for_entity, false);
    if (!ref || ref.__TYPE__ !== "Entity") {
      loopar.throw(`Print Format ${this.name}: "${this.for_entity || ""}" is not an entity.`);
    }

    await super.save(...arguments);

    if (loopar.utils.trueValue(this.is_default)) await this.#clearOtherDefaults();
  }

  async makeViews() {
    if (!this.#hasIdentity()) return;
    return await super.makeViews(...arguments);
  }

  /** One default per entity: the format just marked default unmarks the others (row + file). */
  async #clearOtherDefaults() {
    for (const format of listPrintFormats(this.for_entity)) {
      if (format.name === this.name || !loopar.utils.trueValue(format.is_default)) continue;

      const ref = loopar.getRef(format.name, false);
      if (!ref) continue;

      await loopar.db.setValue("Print Format Builder", "is_default", 0, format.name);
      const cfg = fileManage.getConfigFile(format.name, ref.__ROOT__);
      if (cfg) await fileManage.setConfigFile(format.name, { ...cfg, is_default: 0 }, ref.__ROOT__);
    }
  }
}
