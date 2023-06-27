
'use strict';

import { access } from 'fs'
import DataBase from '../database/database.js';
import { GlobalEnvironment } from './global/element-definition.js';
import { document_manage } from './document/document-manage.js';
import path from "path";
import { file_manage } from "./file-manage.js";
import sha1 from "sha1";
import * as Helpers from "./helper.js";
import { simpleGit, CleanOptions } from 'simple-git';
import elementGenerator from "./element-generator.js";
import { Session } from "./session.js";
import dayjs from "dayjs";

simpleGit().clean(CleanOptions.FORCE);

export class Loopar {
   installing = false;
   modules_group = []
   path_root = process.env.PWD;
   path_framework = process.argv[1];
   base_document_fields = ["id", "name", "type", "module", "doc_structure", "title_fields", "search_fields", "is_single", "is_static"];
   session = new Session();
   constructor() {
      /*const options = {...CleanOptions, ...{
            baseDir: path.join(this.path_root, "apps"),
            binary: 'git',
            maxConcurrentProcesses: 6,
            trimmed: false,
         }};

      this.git = simpleGit(options);*/
   }

   validateGitRepository(repository) {
      if (!this.gitRepositoryIsValid(repository)) {
         loopar.throw('Invalid GitHub URL ' + repository);
      }
   }

   gitRepositoryIsValid(repository) {
      const regex = new RegExp(/^(((https?\:\/\/)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})\/))|((ssh\:\/\/)?git\@)(((([a-zA-Z0-9][a-zA-Z0-9\-\_]{1,252})\.){1,8}[a-zA-Z]{2,63})(\:)))([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})(\/)([a-zA-Z0-9][a-zA-Z0-9\_\-]{1,36})((\.git)?)$/);
      return regex.test(repository);
   }

   gitAppOptions(app) {
      return {
         baseDir: path.join(this.path_root, "apps", app),
         binary: 'git',
         maxConcurrentProcesses: 6,
         trimmed: false,
      }
   }

   git(app) {
      return simpleGit(this.gitAppOptions(app));
   }

   hash(value) {
      return sha1(value);
   }

   async initialize() {
      console.log('Initializing Loopar...');
      await this.GlobalEnvironment();
      await this.#load_config();
      this.db = new DataBase();
      await this.db.initialize();
      await this.make_config();
      this.utils = Helpers;
   }

   async #load_config(data = null) {
      if (data) {
         Object.assign(this, data);
      } else {
         await this.#load_config(file_manage.get_config_file('loopar.config'));
      }
   }

   async make_config() {
      await file_manage.make_folder('public/js', 'components');
      await file_manage.make_file('public/js/components', 'elements', elementGenerator(), 'js', true);
      const write_file = async (data) => {
         await file_manage.set_config_file('loopar.config', data);

         await this.#load_config(data)
      }

      const write_modules = async (data) => {
         this.db.pagination = null;

         const group_list = await this.db.get_list('Module Group', ['name', 'description'], { '=': { in_sidebar: 1 } });

         for (const g of group_list) {
            const modules_group = { name: g.name, description: g.description, modules: [] };

            const module_list = await this.db.get_list(
               'Module',
               ['name', 'icon', 'description', 'module_group'],
               {
                  '=': { module_group: g.name },
                  'AND': {
                     '=': { in_sidebar: 1 },
                  },
               }
            );

            for (const m of module_list) {
               const module = { link: m.name, icon: m.icon, description: m.description, routes: [] };

               const route_list = await this.db.get_list("Document", ['name', 'is_single'], {
                  '=': { module: m.name }
               });

               module.routes = route_list.map(route => {
                  return { link: route.is_single ? 'update' : route.name, description: route.name }
               });

               modules_group.modules.push(module);
            }

            data.modules_group.push(modules_group);
         }

         data.initialized_modules = true;
         this.modules_group = data.modules_group;

         await write_file(data);
      }

      const data = {
         database_initialized: this.database_initialized,
         modules_group: []
      };

      data.database_server_initialized = await this.db.test_server();
      data.database_initialized = data.database_server_initialized && await this.db.test_database();
      data.framework_installed = data.database_initialized && await this.db.test_framework();

      if (data.framework_installed) {
         data.base_document_fields = this.#make_doctype_fields(
            JSON.parse(await this.db.get_value('Document', 'doc_structure', 'Document')) || []
         ).filter(field => fieldIsWritable(field)).map(field => field.data.name);

         data.base_form_fields = this.#make_doctype_fields(
            JSON.parse(await this.db.get_value('Document', 'doc_structure', 'Form')) || []
         ).filter(field => fieldIsWritable(field)).map(field => field.data.name);

         await write_modules(data);
      } else {
         await write_file(data);
      }
   }

   async #write_default_settings() {
      await file_manage.make_folder('', "config");

      if (!file_manage.exist_file_sync(path.join('config', 'db.config.json'))) {
         await file_manage.set_config_file('db.config', {
            "host": "localhost",
            "user": "root",
            "password": "root",
            "port": "3306",
            "database": "db_36b1a6ecba92b4dee1451bcea2a20acdaa2a5dd0",
            "dialect": "mysql",
            "pool": {
               "max": 5,
               "min": 0,
               "acquire": 30000,
               "idle": 10000
            }
         });
      }

      if (!file_manage.exist_file_sync(path.join('config', 'loopar.config.json'))) {
         await file_manage.set_config_file('loopar.config', {});
      }

      if (!file_manage.exist_file_sync(path.join('config', 'server.config.json'))) {
         await file_manage.set_config_file('server.config', {
            "port": 3030,
            "session": {
               "secret": "secrctekeyf5d665dd56ff59fbd24699e502a528f77eb786e8",
               "saveUninitialized": false,
               "cookie": { "maxAge": 86400000 },
               "resave": false
            }
         });
      }
   }

   async GlobalEnvironment() {
      GlobalEnvironment();

      global.AJAX = 'POST';
      global.current_controller = null;
      global.env = {};
      global.dayjs = dayjs;
      await this.#write_default_settings();

      env.db_config = file_manage.get_config_file('db.config');
      env.loopar_config = file_manage.get_config_file('loopar.config');
      env.server_config = file_manage.get_config_file('server.config');

      process.on('uncaughtException', err => {
         console.error(['uncaughtException', err]);

         if (this.db) {
            this.db.transaction = false;
            this.db.transactions = [];
         }

         if (current_controller) {
            current_controller.send_error(err);
         }
      });
   }

   #make_doctype_fields(fields = JSON.parse(this.__DOCTYPE__.doc_structure) || []) {
      return fields.reduce((acc, field) => {
         return acc.concat(field, ...this.#make_doctype_fields(field.elements || []));
      }, []);
   }

   async #GET_DOCTYPE(document, type = 'Document', field_doc_structure, by_file = null) {
      const fields = type === 'Document' ? this.base_document_fields : this.base_form_fields;
      let doctype;


      if (by_file) {
         const doc = document.replaceAll(/\s+/g, '-').toLowerCase();
         doctype = file_manage.get_config_file(doc, path.join("apps", by_file, doc));
      } else {
         doctype = await loopar.db.get_doc(type, document, [field_doc_structure, ...fields]);
      }

      if (!doctype) {
         this.throw({
            code: 404,
            message: `Document ${document} not found`,
         });
      }

      return doctype;
   }

   async get_document(document, document_name, data = null, by_file = null) {
      const DOCTYPE = await this.#GET_DOCTYPE(document, 'Document', 'doc_structure', by_file);

      if (DOCTYPE && by_file) {
         DOCTYPE.app_name = by_file.split('/')[0];
      }

      return await document_manage.get_document(DOCTYPE, document_name, data);
   }

   async new_document(document, data = {}, document_name = null, by_file = null) {
      const DOCTYPE = await this.#GET_DOCTYPE(document, 'Document', 'doc_structure', by_file);
      if (DOCTYPE && by_file) {
         DOCTYPE.app_name = by_file.split('/')[0];
      }

      return await document_manage.new_document(DOCTYPE, data, document_name);
   }

   async delete_document(document, document_name, update_installer = true) {
      const doc = await this.get_document(document, document_name);

      doc.delete({ update_installer });
   }

   async get_form(form_name, data = {}) {
      const DOCTYPE = await this.#GET_DOCTYPE(form_name, 'Form', 'form_structure');

      return document_manage.get_form(DOCTYPE, data);
   }

   async new_form(form_name, data = {}) {
      const DOCTYPE = await this.#GET_DOCTYPE(form_name, 'Form', 'form_structure');

      return await document_manage.new_form(DOCTYPE, data);
   }

   exist(path) {
      return new Promise(res => {
         access(path, (err) => {
            return res(!err);
         });
      });
   }

   async get_list(document, { fields = null, filters = {}, order_by = 'name', limit = 10, offset = 0, q = null } = {}) {
      const doc = await this.new_document(document);

      return await doc.get_list({ fields, filters, order_by, limit, offset, page: this.session.get(document + "_page") || 1, q });
   }

   json_parse(json) {
      try {
         return JSON.parse(json);
      } catch (e) {
         return {};
      }
   }

   get base_path() {
      return Helpers.lowercase(path.join(__dirname.split('apps')[0], 'apps', 'loopar'));
   }

   get_error(error_type, error_message, error_code = 500) {
      return {
         code: err.code || 500,
         message: err.message || 'Internal Server Error',
         data: err.data || null,
      };
   }

   throw(error) {
      this.installing = false;
      const error_type = NOT_IMPLEMENTED_ERROR;
      if (typeof error === 'string') {
         error = {
            error: error_type.code,
            error_type: error_type.title,
            message: error
         };
      } else if (typeof error === 'object') {
         error = {
            error: (error.code || error_type.code),
            error_type: (error.code ? 'Error ' + error.code : error_type.title),
            message: error.message || error_type.title,
         };
      }

      if (current_controller) {
         current_controller.error = error;
      }

      throw new Error(error.message);
   }

   async get_user(user_id) {
      const user = await this.db.get_list('User',
         ['name', 'email', 'password', 'disabled', 'profile_picture'],
         { '=': { name: user_id }, "OR": { '=': { email: user_id } } }
      );

      return user.length > 0 ? user[0] : null;
   }

   get session() {
      return this.server && this.server.req && this.server.req.session ? this.server.req.session : {};
   }

   isLoggedIn() {
      return this.current_user;
   }

   get current_user() {
      //return { name: "Administrator", email: "test@mail.common" }
      return this.session.get('user') || null;
      //return this.session.user || null;
   }

   async update_installer(_path, document, name, record, delete_record = false) {
      if (this.installing) return;

      const installer_data = file_manage.get_config_file('installer', _path) || {};

      if (installer_data) {
         if (delete_record) {
            delete installer_data[document][name];
         } else {
            installer_data[document] = installer_data[document] || {};

            installer_data[document][name] = record;
         }

         await file_manage.set_config_file('installer', installer_data, _path);
      }
   }

   async app_status(app_name) {
      return await loopar.db.get_value('App', 'name', app_name) ? 'installed' : 'uninstalled';
   }

   async get_app(app_name) {
      if (await this.app_status(app_name) === 'installed') {
         return await loopar.db.get_doc('App', app_name);
      } else {
         return null;
      }
   }
}

export const loopar = await new Loopar();

