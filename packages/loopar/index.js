
import BaseDocument from "./core/document/base-document.js";
import { server } from "./core/server.js";
import { loopar } from "./core/loopar.js";
import { documentManage } from "./core/document/document-manage.js";
import { fileManage } from "./core/file-manage.js";
import BaseController from "./core/controller/base-controller.js";
import SingleController from "./core/controller/single-controller.js";
import PageController from "./core/controller/page-controller.js";
import ViewController from "./core/controller/view-controller.js";
import ReportController from "./core/controller/report-controller.js";
import FormController from "./core/controller/form-controller.js";
import SystemController from "./apps/core/modules/system/controllers/system/system-controller.js";
import CoreInstaller from "./apps/core/modules/system/forms/installer/installer.js";
import * as Helpers from "./core/global/helper.js";
import { elementsNames, elementsNameByType, elementsDict } from "./core/global/element-definition.js";
import { MetaComponents } from "./core/global/require-components.js";
export {themes, showColors} from "./core/global/themes.js";

export {
  loopar,
  server,
  documentManage,
  BaseDocument,
  BaseController,
  SystemController,
  SingleController,
  PageController,
  ViewController,
  ReportController,
  FormController,
  fileManage,
  Helpers,
  elementsNames,
  elementsNameByType,
  elementsDict,
  MetaComponents,
  CoreInstaller
};

await server.initialize();