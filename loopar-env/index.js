import {server} from "./core/server.js";
import {loopar} from "./core/loopar.js";
import {document_manage} from "./core/document/document-manage.js";
import BaseDocument from "./core/document/base-document.js";
import {file_manage} from "./core/file-manage.js";
import BaseController from "./core/controller/base-controller.js";
import SingleController from "./core/controller/single-controller.js";
import InstallerController from "./core/controller/installer-controller.js";
import * as Helpers from "./core/helper.js";
import Installer from "./modules/core/installer/installer.js";
import {elements_names} from "./core/global/element-definition.js";

export {
   loopar,
   server,
   document_manage,
   BaseDocument,
   BaseController,
   InstallerController,
   SingleController,
   file_manage,
   Helpers,
   Installer,
   elements_names
};

await server.initialize();