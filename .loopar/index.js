import { server } from "./core/server.js";
import { loopar } from "./core/loopar.js";
import { documentManage } from "./core/document/document-manage.js";
import BaseDocument from "./core/document/base-document.js";
import { fileManage } from "./core/file-manage.js";
import BaseController from "./core/controller/base-controller.js";
import SingleController from "./core/controller/single-controller.js";
import InstallerController from "./core/controller/installer-controller.js";
import * as Helpers from "./core/global/helper.js";
import CoreInstaller from "./modules/core/installer/core-installer.js";
import { elementsNames, elementsNameByType, elementsDict } from "./core/global/element-definition.js";
import { MetaComponents } from "./core/global/require-components.js";

export {
  loopar,
  server,
  documentManage,
  BaseDocument,
  BaseController,
  InstallerController,
  SingleController,
  fileManage,
  Helpers,
  CoreInstaller,
  elementsNames,
  elementsNameByType,
  elementsDict,
  MetaComponents
};

await server.initialize();