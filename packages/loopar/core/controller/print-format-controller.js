'use strict'

import BaseController from './base-controller.js';
import { loopar } from "loopar";
import { PermissionManager } from "../auth/PermissionManager.js";
import { getPrintFormat, printPayload } from "../document/print-format.js";

/**
 * Controller of every Print Format (the builder generates `<Format>Controller`
 * extending this one). Its only action previews the format on a real record:
 *
 *   /desk/<Format>/view?name=<record>   (no name → the latest record)
 *
 * Rendered by the `print` entry exactly as `/desk/<Entity>/print` would, with
 * this format forced. Needs `view` on the format and a `print` grant with
 * scope 'all' on its entity (a preview may land on anyone's record).
 */
export default class PrintFormatController extends BaseController {
  static actionsEnabled = ["view"];
  defaultAction = "view";

  async actionView() {
    const format = getPrintFormat(this.document);
    if (!format?.for_entity) {
      return loopar.throw({ code: 400, message: `Print Format ${this.document} has no entity to print.` });
    }

    const entity = format.for_entity;
    if (PermissionManager.scope(entity, "print") !== "all") {
      return loopar.throw({ code: 403, message: `You do not have permission to print ${entity}.` });
    }

    const name = this.name || await this.#latestRecord(entity);
    if (!name) {
      return loopar.throw({ code: 404, message: `There are no ${entity} records to preview this format with.` });
    }

    const document = await loopar.getDocument(entity, name);

    // Mount the print entry (clientEntry reads the action).
    this.action = "print";
    return await this.render(document, {
      linkTitles: await document.linkTitles(),
      print: await printPayload(entity, { format }),
    });
  }

  async #latestRecord(entity) {
    const row = await loopar.db.qx()(entity).select("name").orderBy("id", "desc").first();
    return row?.name || null;
  }
}
