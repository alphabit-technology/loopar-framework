import path from "path";
import {loopar} from "./loopar.js";
import {decamelize, lowercase} from './helper.js';
import fs, {access, mkdir} from 'fs'

class FileManage {
   async make_file(destiny, name, content, ext = 'js', replace=false) {
      const file_path = this.join(loopar.path_root, destiny, this.file_name(name, ext));

      return new Promise((resolve, reject) => {
         fs.existsSync(file_path) && ext === 'js' && !replace ? resolve(true) : fs.writeFile(file_path, content, (err) => {
            if (err) {
               console.log(['make_file err', err]);
               reject(err);
            }

            resolve(true);
         });
      });
   }

   exist_file_sync(file_route) {
      try {
         fs.accessSync(path.resolve(path.join(loopar.path_root, file_route)));
         return true;
      } catch (e) {
         return false;
      }
   }

   async make_folder(destiny, name) {
      const folder_path = this.join(loopar.path_root, destiny, this.folder_name(name));

      return new Promise((resolve, reject) => {
         mkdir(folder_path, {recursive: true}, (err) => {
            err ? reject(err) : resolve(true);
         });
      });
   }

   join(...args) {
      const paths = args.reduce((acc, arg) => {
         if (typeof arg === 'string') {
            return acc.concat(arg.split('/'));
         }

         if (typeof arg === 'object') {
            return acc.concat(arg);
         }
      }, []);

      return lowercase(path.join('/', ...paths));
   }

   async make_class(destiny, name, {IMPORTS = {}, EXTENDS = null} = {}, importer_type = '') {
      const _EXTENDS = EXTENDS ? ` extends ${EXTENDS}` : '';
      const CONSTRUCTOR = EXTENDS ? `super(props);` : 'Object.assign(this, props);';

      name = this.class_name(name);
      const o = importer_type === 'default' ? '' : '{';
      const c = importer_type === 'default' ? '' : '}';

      const class_content = `
'use strict';

${Object.entries(IMPORTS).map(([ref, file]) => `import ${o}${ref}${c} from '${file}';`).join('\n')}

export default class ${name}${_EXTENDS} {
    constructor(props){
        ${CONSTRUCTOR}
    }
}`;

      await this.make_file(destiny, name, class_content);
   }

   file_name(name, ext = 'js') {
      return `${lowercase(decamelize(name, {separator: '-'}))}.${ext}`;
   }

   folder_name(name) {
      return lowercase(decamelize(name, {separator: '-'}));
   }

   class_name(name) {
      return name.replace(/\s/g, '');
   }

   get_config_file(file_name, _path=null, if_error = "throw") {
      const path_file = this.file_name((`./${_path || `config`}/${file_name}`), 'json');

      try {
         return JSON.parse(fs.readFileSync(path.resolve(loopar.path_root, path_file), 'utf8') || {});
      }catch (e) {
         if(if_error === "throw"){
            throw new Error(e);
         }else{
            return if_error;
         }
      }
   }

   get_app_data(app_name){
      return this.get_config_file("installer", path.join('apps', app_name), null);
   }

   async set_config_file(file_name, data, path = null) {
      const dir_path = path || `config`;

      await this.make_file(dir_path, file_name, JSON.stringify(data, null, 2), 'json');
   }

   async exist_file(file_route) {
      const is_relative = file_route.startsWith('.');

      return new Promise(resolve => {
         access(path.resolve(path.join(loopar.path_root, file_route)), (err) => {
            return resolve(!err);
         });
      });
   }

   async exist_folder(folder_route) {
      return new Promise(resolve => {
         access(path.resolve(loopar.path_root + folder_route), (err) => {
            return resolve(!err);
         });
      });
   }

   async import_file(file_route) {
      const is_relative = file_route.startsWith('.');
      return await import( is_relative ? file_route : path.join(loopar.path_root, file_route));
   }
}

export const file_manage = new FileManage();