
'use strict';
import Entity from "../entity/entity.js";
import {fileManage, loopar} from "loopar";
import { Helpers } from "loopar";

export default class BuilderFactory extends Entity {
  type = "Builder";

  constructor(props) {
    super(props);
  }

  async modulePath() {
    return loopar.makePath("apps",  await this.targetApp(), "modules", this.module, "builders");
  }

  async makeViews() {
    const documentPath = await this.documentPath();

    /*Entity Model*/
    await fileManage.makeClass(documentPath, this.name, {
      IMPORTS: {
        'Entity': '../../../../../loopar/modules/core/entities/entity/entity.js',
      },
      EXTENDS: 'Entity'
    });
    /*Entity Model*/

    /*Entity Controller*/
    const extendController = "BaseController";
    await fileManage.makeClass(documentPath, `${this.name}Controller`, {
      IMPORTS: {
        [extendController]: 'loopar',
      },
      EXTENDS: extendController
    });
    /*Entity Controller*/

    // Client views are not generated: the loader falls back to the base
    // `<kind>-context` (packages/loopar/src/loader.jsx).
  }
}