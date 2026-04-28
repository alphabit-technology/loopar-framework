import { GlobalEnvironment } from '../global/element-definition.js';
import path from "pathe";
import dayjs from "dayjs";
import crypto from "crypto-js";
import * as lucideIcons from 'lucide-react';
import * as simpleIcons from 'simple-icons';

import { fileManage } from "../file-manage.js";
import { elementsDict, elementsDefinition } from "../global/element-definition.js";
import {PermissionManager} from "../auth/PermissionManager.js"
import { existsSync, mkdirSync, readdirSync, readFileSync } from "fs";


import inflection, { titleize, singularize } from "inflection";

const toLooparKey = (name) => name.charAt(0).toLowerCase() + name.slice(1);

export class Builder {
  async buildRefs() {
    let types = {};
    const docs = this.getEntities();
  
    const getEntityFields = (fields) => {
      const getFields = fields => fields.reduce((acc, field) => 
        acc.concat(field, ...getFields(field.elements || [])), []);
      return getFields(fields).filter(field => {
        const def = elementsDict[field.element]?.def || {};
        return def.isWritable && !!field.data.name;
      }).map(field => field.data.name);
    }
  
    const refs = {};
    const types_ = {};
    const refsByApp = {};
  
    for (const doc of Object.values(docs)) {
      if (doc.__document_status__ === "Deleted") continue;
  
      const isBuilder = (doc.build || ['Builder', 'Entity'].includes(doc.name)) ? 1 : 0;
      const isChild = doc.is_child ? 1 : 0;
      const isSingle = this.entityIsSingle(doc);
      const fields = typeof doc.doc_structure === "object" 
        ? doc.doc_structure 
        : JSON.parse(doc.doc_structure || "[]");
      const id = parseInt(doc.id) || 0;
  
      const appKey = inflection.transform(doc.__APP__, ['capitalize', 'dasherize']).toLowerCase();
  
      const ref = {
        id,
        __NAME__: doc.name,
        __APP__: doc.__APP__,
        __APP_KEY__: appKey,
        __ENTITY__: doc.__ENTITY__ || "Entity",
        __ROOT__: doc.entityRoot,
        is_single: isSingle,
        is_builder: isBuilder,
        is_child: isChild,
        __MODULE__: doc.__MODULE__,
        __TYPE__: doc.type,
        __FIELDS__: getEntityFields(fields)
      };
  
      const key = this.utils.toEntityKey(doc.name);
      refs[key] = ref;
  
      if (!refsByApp[appKey]) refsByApp[appKey] = {};
      refsByApp[appKey][key] = ref;
  
      if (isBuilder) {
        types_[doc.name] = {
          id,
          __ROOT__: doc.entityRoot,
          __NAME__: doc.name,
          __ENTITY__: doc.__ENTITY__ || "Entity",
          __BUILD__: doc.build || doc.name,
          __APP__: doc.__APP__,
          __ID__: doc.id,
          __TYPE__: doc.type,
          __MODULE__: doc.__MODULE__,
          __FIELDS__: getEntityFields(fields)
        };
      }
    }
  
    this.__REFS__ = refs;
    this.__TYPES__ = types_;
    this.__REFS_BY_APP__ = refsByApp;
  }

  makePath(...args) {
    let pathArray = args;

    if (!args[0].startsWith("./")) {
      pathArray = ["/", ...args];
    }

    const joinedPath = path.join(...pathArray);

    return this.utils.decamelize(joinedPath, { separator: '-' });
  }

  async buildIcons() {
    if (!this.__installed__) return;
    const refs = this.getRefs();
  
    const directIcons = [];
  
    const evalFields = (fields) => {
      fields = Array.isArray(fields) ? fields : [];
      return fields.reduce((acc, field) => {
        if (field.element === ICON_INPUT) {
          acc.push(field.data.name);
        }
        if (field.element === ICON || field.element === TEXT_BLOCK_ICON) {
          directIcons.push(field.data.icon);
        }
        if (field.elements) {
          acc.push(...evalFields(field.elements));
        }
        return acc;
      }, []);
    };
  
    const refIcons = {};
    Object.values(refs).forEach(ref => {
      const docJson = fileManage.getConfigFile(
        ref.__NAME__.replaceAll(' ', '-').toLowerCase(),
        ref.__ROOT__
      );
      if (docJson?.doc_structure) {
        const fields = evalFields(
          this.utils.JSONparse(docJson.doc_structure, docJson.doc_structure)
        );
        if (fields.length) refIcons[ref.__NAME__] = { fields, isSingle: ref.is_single };
      }
    });
  
    const iconImports = new Set();
    for (const [entity, ent] of Object.entries(refIcons)) {
      if (!ent.isSingle) {
        if (
          (await this.db.hasEntity(null, entity)) &&
          (await this.db.hasTable(entity))
        ) {
          for (const res of await this.db.getAll(entity, ent.fields)) {
            for (const field of ent.fields) {
              const icon = (res[field] || '').replaceAll(/[- ]/g, '');
              if (icon) iconImports.add(icon);
            }
          }
        }
      }
    }
  
    Object.values(elementsDefinition).forEach(ed => {
      ed.forEach(d => directIcons.push(d.icon));
    });
  
    const tenantIcons = Array.from(new Set([...iconImports, ...directIcons])).filter(Boolean);
  
    await fileManage.makeFile(
      'app/auto/icon-segments',
      this.tenantId,
      JSON.stringify(tenantIcons),
      'json',
      true
    );
  
    const segmentsDir = path.join(this.pathRoot, 'app/auto/icon-segments');
    const segmentFiles = existsSync(segmentsDir)
      ? readdirSync(segmentsDir).filter(f => f.endsWith('.json'))
      : [];
  
    const allIcons = Array.from(new Set(
      segmentFiles.flatMap(file => {
        try {
          return JSON.parse(readFileSync(path.join(segmentsDir, file), 'utf-8'));
        } catch {
          return [];
        }
      })
    )).filter(Boolean);
  
    const toSimpleKey  = (name) => name.charAt(0).toLowerCase() + name.slice(1);
    const isSimpleIcon = (name) => /^Si[A-Z]/.test(name);
  
    const lucideIconNames = allIcons
      .filter(name => !isSimpleIcon(name) && lucideIcons[name]);
  
    const simpleIconNames = allIcons
      .filter(name => isSimpleIcon(name) && simpleIcons[toSimpleKey(name)]);
  
    const lines = ['// this file is autogenerated — do not edit by hand'];
  
    if (lucideIconNames.length) {
      lines.push(`export { ${lucideIconNames.join(', ')} } from "lucide-react";`);
    }
  
    if (simpleIconNames.length) {
      lines.push(`export { ${simpleIconNames.join(', ')} } from "@icons-pack/react-simple-icons";`);
    }
  
    await fileManage.makeFile(
      'app/auto',
      'preloaded-icons',
      lines.join('\n'),
      'jsx',
      true
    );
  }

  async build() {
    console.log('......Building Loopar.......');

    await this.makeDefaultFolders();
    if (this.installingApp) return;

    await this.buildRefs();
   
    const writeFile = async (data) => {
      await fileManage.setConfigFile('loopar.config', data);

      await this.loadConfig(data);
    }

    const writeModules = async (data) => {
      this.db.pagination = null;
      const groupList = await this.db.getList('Module Group', ['name', 'description'], {in_sidebar: 1 });

      for (const g of groupList) {
        const modulesGroup = { name: g.name, description: g.description, modules: [] };

        const moduleList = await this.db.getList(
          'Module',
          ['name', 'icon', 'description', 'module_group'],
          {module_group: g.name, in_sidebar: 1}
        );

        for (const m of moduleList) {
          const module = { link: m.name, icon: m.icon, description: m.description, routes: [] };

          const routeList = await this.db.getList("Entity", ['name', 'is_single'], {module: m.name});

          module.routes = routeList.map(route => {
            return { link: route.is_single ? 'update' : route.name, description: route.name }
          });

          modulesGroup.modules.push(module);
        }

        data.modulesGroup.push(modulesGroup);
      }

      data.initializedModules = true;
      this.modulesGroup = data.modulesGroup;

      await writeFile(data);
    }

    const data = {
      DBInitialized: this.DBInitialized,
      modulesGroup: []
    };

    this.DBServerInitialized = await this.db.testServer();
    this.DBInitialized = (this.DBServerInitialized && await this.db.testDatabase());
    this.__installed__ = (this.DBInitialized && await this.db.testFramework("loopar"));

    data.DBInitialized = this.DBInitialized;
    data.DBServerInitialized = this.DBServerInitialized;
    data.__installed__ = this.__installed__;

    if (data.__installed__) {
      const activeWebApp = await this.db.getDoc('System Settings');
      const webApp = await this.db.getParseDoc('App', activeWebApp.active_web_app);

      data.webApp = {
        ...(webApp || {}),
        menu_items: webApp ? await this.db.getAll("Menu Item", ["*"], { parent_id: webApp.id }) : [],
        menu_actions: webApp ? await this.db.getAll("Menu Action", ["*"], { parent_id: webApp.id }) : []
      }

      await writeModules(data);

      await PermissionManager.boot();
    } else {
      await writeFile(data);
    }
  }

  async rebuildVite() {
    console.log('*********Restarting Vite*********');
    await this.server.vite.restart();
    console.log('*********Reloading Browser*********');
    await this.server.vite.ws.send({ type: 'full-reload' });
  }

  async loadConfig(data = null) {
    if (data) {
      Object.assign(this, data);
    } else {
      const globalConfig = fileManage.getConfigFile("redis.config", "config", {})
      await this.loadConfig({...fileManage.getConfigFile('loopar.config', null, {}), ...globalConfig});
    }
  }

  async writeDefaultSSettings() {
    await fileManage.makeFolder("config");
    await fileManage.makeFolder("sites", this.tenantId, "config");

    if (!fileManage.existFileSync(path.join('sites',this.tenantId, "config", 'db.config.json'))) {
      await fileManage.setConfigFile('db.config', {});
    }

    if (!fileManage.existFileSync(path.join('sites', this.tenantId, 'config', 'loopar.config.json'))) {
      await fileManage.setConfigFile('loopar.config', {});
    }
  }

  async buildGlobalEnvironment() {
    GlobalEnvironment();
    
   const handleFatalError = async (err, source) => {
      console.error(`${source}:`, err);
      this.installingApp = null;
      this.db && (await this.db.safeRollback());
      
      /* try {
        this.server?.renderError({ 
          error: getHttpError(err), 
          redirect: err?.redirect 
        });
      } catch (renderError) {
        console.error('Failed to render error:', renderError.message);
      } */
    };

    //process.on('uncaughtException', (err) => handleFatalError(err, 'uncaughtException'));
    //process.on('unhandledRejection', (err) => handleFatalError(err, 'unhandledRejection'));

    global.Crypto = crypto;
    global.AJAX = 'POST';
    global.env = {};
    global.dayjs = dayjs;

    await this.writeDefaultSSettings();
    env.looparConfig = fileManage.getConfigFile('loopar.config', null, {});
  }

  async makeDefaultFolders() {
    await fileManage.makeFolder("apps");
    await fileManage.makeFolder("app", "auto");
    await fileManage.makeFolder('uploads', "public", "thumbnails");
    await fileManage.makeFolder('uploads', "private", "thumbnails");
  }
}