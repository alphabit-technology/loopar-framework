
import BaseDocument from "./core/document/base-document.js";
import BaseStorage from "./core/document/base-storage.js";
import { loopar } from "./core/loopar.js";
import {
  StorageDriver,
  LocalDriver,
  CloudinaryDriver,
} from "./core/global/storage/index.js";
import { documentManage } from "./core/document/document-manage.js";
import { fileManage } from "./core/file-manage.js";
import fileManager from "./core/global/file-manager.js";
import BaseController from "./core/controller/base-controller.js";
import SingleController from "./core/controller/single-controller.js";
import PageController from "./core/controller/page-controller.js";
import ViewController from "./core/controller/view-controller.js";
import ReportController from "./core/controller/report-controller.js";
import FormController from "./core/controller/form-controller.js";
import SystemController from "./apps/core/modules/system/controllers/system/system-controller.js";
import CoreInstaller from "./apps/core/modules/system/forms/installer/installer.js";
import * as Helpers from "./core/global/helper.js";
import { getRequest, getResponse } from "./core/server/router/request-context.js";
import {
  elementsNames,
  elementsNameByType,
  elementsDict,
  AIPrompt,
  TYPES,
  COLUMN_FORMAT,
  COLUMN_FORMATS,
  LEGACY_TAG_TO_FORMAT,
  resolveColumnFormat,
  registerColumnFormat,
} from "./core/global/element-definition.js";
import { MetaComponents } from "./core/global/require-components.js";
export {themes, showColors} from "./core/global/themes.js";
export {generateThemeCSS} from "./core/global/theme-generator.js";
import { parseDocument } from './core/document/tools.js';
import {
  pruneDocStructure,
  getNodeKey
} from './core/global/prune-doc-structure.js';
import {PermissionManager} from './core/auth/PermissionManager.js'
import {tenant} from './bin/tenant/tenant-builder.js';
import { ActionScanner } from "./core/auth/ActionScanner.js";
import { Op, opByDescription, isOpSymbol } from 'db-env';

import {
  DOC_STATUS,
  DOC_STATUS_LABEL,
  AUDIT_COLUMN_NAMES,
  AUDIT_COLUMN_SET,
  FRAMEWORK_OWNED_COLUMN_NAMES,
  FRAMEWORK_OWNED_COLUMN_SET,
  coerceDocStatus,
  isAuditableEntity,
  addAuditColumns,
  addPrimaryKey,
} from './core/global/audit.js';

export {
  loopar,
  documentManage,
  BaseDocument,
  BaseStorage,
  StorageDriver,
  LocalDriver,
  CloudinaryDriver,
  BaseController,
  SystemController,
  SingleController,
  PageController,
  ViewController,
  ReportController,
  FormController,
  fileManage,
  fileManager,
  Helpers,
  elementsNames,
  elementsNameByType,
  elementsDict,
  MetaComponents,
  CoreInstaller,
  AIPrompt,
  parseDocument,
  TYPES,
  COLUMN_FORMAT,
  COLUMN_FORMATS,
  LEGACY_TAG_TO_FORMAT,
  resolveColumnFormat,
  registerColumnFormat,
  PermissionManager,
  tenant,
  ActionScanner,
  pruneDocStructure,
  getNodeKey,
  Op,
  opByDescription,
  isOpSymbol,
  DOC_STATUS,
  DOC_STATUS_LABEL,
  AUDIT_COLUMN_NAMES,
  AUDIT_COLUMN_SET,
  FRAMEWORK_OWNED_COLUMN_NAMES,
  FRAMEWORK_OWNED_COLUMN_SET,
  coerceDocStatus,
  isAuditableEntity,
  addAuditColumns,
  addPrimaryKey,
  getRequest,
  getResponse
};