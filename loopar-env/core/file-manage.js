import path from "path";
import { loopar } from "./loopar.js";
import { decamelize, lowercase } from './helper.js';
import fs, { access, mkdir } from 'fs'

class FileManage {
   async makeFile(destiny, name, content, ext = 'js', replace = false) {
      const filePath = loopar.makePath(loopar.pathRoot, destiny, this.fileName(name, ext));

      return new Promise((resolve, reject) => {
         fs.existsSync(filePath) && ext === 'js' && !replace ? resolve(true) : fs.writeFile(filePath, content, (err) => {
            if (err) {
               console.log(['make_file err', err]);
               reject(err);
            }

            resolve(true);
         });
      });
   }

   existFileSync(fileRoute) {
      try {
         fs.accessSync(path.resolve(loopar.makePath(loopar.pathRoot, fileRoute)));
         return true;
      } catch (e) {
         return false;
      }
   }

   async makeFolder(destiny, name) {
      const folder_path = loopar.makePath(loopar.pathRoot, destiny, name);

      return new Promise((resolve, reject) => {
         mkdir(folder_path, { recursive: true }, (err) => {
            err ? reject(err) : resolve(true);
         });
      });
   }

   async makeClass(destiny, name, { IMPORTS = {}, EXTENDS = null } = {}, importer_type = '') {
      const _EXTENDS = EXTENDS ? ` extends ${EXTENDS}` : '';
      const CONSTRUCTOR = EXTENDS ? `super(props);` : 'Object.assign(this, props);';

      name = this.className(name);
      const file_name = this.fileName(name);

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

      await this.makeFile(destiny, name, class_content);
   }

   fileName(name, ext = 'js') {
      return `${lowercase(decamelize(name, { separator: '-' }))}.${ext}`;
   }

   folderName(name) {
      return lowercase(decamelize(name, { separator: '-' }));
   }

   className(name) {
      return name.replace(/\s/g, '');
   }

   getConfigFile(file_name, _path = null, if_error = "throw") {
      const path_file = this.fileName((`./${_path || `config`}/${file_name}`), 'json');

      try {
         return JSON.parse(fs.readFileSync(path.resolve(loopar.pathRoot, path_file), 'utf8') || {});
      } catch (e) {
         console.log(['get_config_file err', e, if_error]);
         if (if_error === "throw") {
            throw new Error(e);
         } else {
            return if_error;
         }
      }
   }

   getAppData(app_name) {
      return this.getConfigFile("installer", loopar.makePath('apps', app_name), null);
   }

   async setConfigFile(file_name, data, path = null) {
      const dir_path = path || `config`;

      await this.makeFile(dir_path, file_name, JSON.stringify(data, null, 2), 'json');
   }

   async existFile(fileRoute) {
      return new Promise(resolve => {
         access(path.resolve(loopar.makePath(loopar.pathRoot, fileRoute)), (err) => {
            return resolve(!err);
         });
      });
   }

   async existFolder(folder_route) {
      return new Promise(resolve => {
         access(path.resolve(loopar.makePath(loopar.pathRoot, folder_route)), (err) => {
            return resolve(!err);
         });
      });
   }

   async importFile(fileRoute, onError = null) {
      const is_relative = fileRoute.startsWith('.');
      
      try {
         return await import(is_relative ? fileRoute : loopar.makePath(loopar.pathRoot, fileRoute));
      } catch (e) {
         onError ? onError(e) : loopar.throw(e);
      }
   }
}

export const fileManage = new FileManage();