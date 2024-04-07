import path from "path";
import { loopar } from "./loopar.js";
import fs, { access, mkdir } from 'fs'

class FileManage {
  async makeFile(destiny, name, content, ext = 'js', replace = false) {
    const filePath = loopar.makePath(loopar.pathRoot, destiny, this.fileName(name, ext));

    return new Promise((resolve, reject) => {
      fs.existsSync(filePath) && ['jsx', 'tsx', 'js'].includes(ext) && !replace ? resolve(true) : fs.writeFile(filePath, content, (err) => {
        if (err) {
          console.log(['make_file err', err]);
          reject(err);
        }

        resolve(true);
      });
    });
  }

  async existFile(fileRoute) {
    const isRelative = fileRoute.startsWith("./");
      return new Promise(resolve => {
      access(isRelative ? path.resolve(fileRoute) : path.resolve(loopar.makePath(loopar.pathRoot, fileRoute)), (err) => {
        return resolve(!err);
      });
    });
  }

  existFileSync(fileRoute) {
    const isRelative = fileRoute.startsWith('.');
    const route = isRelative ? path.resolve(fileRoute) : path.resolve(loopar.makePath(loopar.pathRoot, fileRoute));

    try {
      fs.accessSync(route);
      return true;
    } catch (e) {
      return false;
    }
  }

  async existFolder(folderRoute) {
    return new Promise(resolve => {
      access(path.resolve(loopar.makePath(loopar.pathRoot, folderRoute)), (err) => {
        return resolve(!err);
      });
    });
  }

  /*async importFile(fileRoute, onError = null) {
     const isRelative = fileRoute.startsWith('.');
     isRelative && console.log("Test is relative", path.resolve(fileRoute))
     const route = isRelative ? fileRoute : loopar.makePath(loopar.pathRoot, fileRoute);

     try {
        if (!this.existFileSync(fileRoute)) {
           onError ? onError(`File ${fileRoute} not found`) : loopar.throw(`File ${fileRoute} not found`);
        } else {
           return await import(route);
        }
     } catch (e) {
        throw new Error(e + ` ${fileRoute}`);
     }

  }*/

  async importClass(fileRote, onError) {
    const isRelative = fileRote.startsWith('.');
    const moduleName = fileRote.split('/').pop().split('.')[0];

    try {
      const Class = await import(isRelative ? fileRote : path.join(loopar.pathRoot, fileRote));
      return Class.default;
    } catch (e) {
      if (e.code === 'ERR_MODULE_NOT_FOUND') {
        const moduleNotFoundName = e.message.split('\'')[1];

        if (moduleNotFoundName === moduleName) {
          if (typeof onError === 'function' && !onError.prototype) {
            return onError(`File ${fileRote} not found`);
          } else if (typeof onError != "object") {
            return onError;
          } else {
            return loopar.throw({
              code: 404,
              message: `File ${fileRote} not found`
            });
          }
        }else{
          return loopar.throw({
            code: 500,
            message: `${e} ${fileRote},\n\nPlease check your dependencies and imports in the file ${fileRote}`
          });
        }
      }

      return loopar.throw({
        code: 500,
        message: `${e} ${fileRote}`
      });
    }
  }

  async makeFolder(destiny, name) {
    const folderPath = loopar.makePath(loopar.pathRoot, destiny, name);

    return new Promise((resolve, reject) => {
      mkdir(folderPath, { recursive: true }, (err) => {
        err ? reject(err) : resolve(true);
      });
    });
  }

  async deleteFolder(destiny, name) {
    const folderPath = loopar.makePath(loopar.pathRoot, destiny, name);

    return new Promise((resolve, reject) => {
      fs.rmdir(folderPath, { recursive: true }, (err) => {
        err ? reject(err) : resolve(true);
      });
    });
  }

  async makeClass(destiny, name, { IMPORTS = {}, EXTENDS = null } = {}, importer_type = '', ext='js') {
    const _EXTENDS = EXTENDS ? ` extends ${EXTENDS}` : '';
    const CONSTRUCTOR = EXTENDS ? `super(props);` : 'Object.assign(this, props);';

    name = this.className(name);
    const fileName = this.fileName(name);

    const o = importer_type === 'default' ? '' : '{';
    const c = importer_type === 'default' ? '' : '}';

    const classContent = `
'use strict';

${Object.entries(IMPORTS).map(([ref, file]) => `import ${o}${ref}${c} from '${file}';`).join('\n')}

export default class ${name}${_EXTENDS} {
    constructor(props){
        ${CONSTRUCTOR}
    }
}`;

    await this.makeFile(destiny, name, classContent, ext);
  }

  fileName(name, ext = 'js') {
    return `${loopar.utils.lowercase(loopar.utils.decamelize(name, { separator: '-' }))}.${ext}`;
  }

  folderName(name) {
    return loopar.utils.lowercase(loopar.utils.decamelize(name, { separator: '-' }));
  }

  className(name) {
    return name.replace(/\s/g, '');
  }

  getConfigFile(fileName, _path = null, ifError = "throw") {
    const path_file = this.fileName((`./${_path || `config`}/${fileName}`), 'json');

    try {
      return JSON.parse(fs.readFileSync(path.resolve(loopar.pathRoot, path_file), 'utf8') || {});
    } catch (e) {
      console.log(['get_config_file err', e, ifError]);
      if (ifError === "throw") {
        throw new Error(e);
      } else {
        return ifError;
      }
    }
  }

  getAppData(appName) {
    return this.getConfigFile("installer", loopar.makePath('apps', appName), null);
  }

  async setConfigFile(fileName, data, path = null) {
    const dirPath = path || `config`;

    await this.makeFile(dirPath, fileName, JSON.stringify(data, null, 2), 'json');
  }
}

export const fileManage = new FileManage();