
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
    const clientPath = await this.clientPath();

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

    const makeView = async (view, context = view) => {
      const importContext = `${Helpers.Capitalize(context)}Context`;
      const viewName = this.name + Helpers.Capitalize(view);

      await fileManage.makeClass(clientPath, viewName, {
        IMPORTS: {
          [importContext]: `@context/${context}-context`
        },
        EXTENDS: importContext
      }, 'default', "jsx");
    }

    for (const context of ["list", "form"]) {
      await makeView(context);
    }
  }
}