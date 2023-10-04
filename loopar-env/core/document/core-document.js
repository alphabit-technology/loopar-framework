'use strict'

import DynamicField from './dynamic-field.js';
import { loopar } from '../loopar.js';

export default class CoreDocument {
   #fields = {};
   documentType = "Document";
   fieldDocStructure = 'doc_structure';
   protectedPassword = "********";

   constructor(props) {
      Object.assign(this, props);
   }

   get fields() {
      return this.#fields;
   }

   onLoad() {

   }

   trigger(event, ...args) {
      if (this[event] && typeof this[event] === 'function') {
         this[event](event, ...args);
      }
   }

   async setApp() {
      if(loopar.installing){
         this.__APP__ = loopar.installingApp;
         return;
      }

      if (this.__DOCTYPE__.name === "App") {
         /**
          * If is an Document type App, the app name is the same as the document name
          */
         this.__APP__ = this.name;
      }else if (this.__DOCTYPE__.name === "Document") {
         /**
          * If is a Document type Document, the app name is the same as the module name
          */
         if(this.name === "Document"){
            this.__APP__ = "loppar";
         }else{
            this.__APP__ ??= await loopar.db.getValue("Module", "app_name", this.module);
         }
      }else if(this.__DOCTYPE__.name === "Module"){
         this.__APP__ = this.app_name;
      }else{
         this.__APP__ ??= await loopar.db.getValue("Module", "app_name", this.__DOCTYPE__.module);
      }
   }

   async __init__() {
      await this.#makeFields(JSON.parse(this.__DOCTYPE__[this.fieldDocStructure]));

      this.__DOCTYPE__.STRUCTURE = JSON.parse(this.__DOCTYPE__[this.fieldDocStructure]).filter(field => field.data.name !== ID);

      if (this.__DOCUMENT__ && this.__DOCUMENT__[this.fieldDocStructure]) {
         this.__DOCUMENT__[this.fieldDocStructure] = JSON.stringify(JSON.parse(this.__DOCUMENT__[this.fieldDocStructure]).filter(field => (field.data || {}).name !== ID));
      }

      await this.setApp();
      this.onLoad();
   }

   async getConnectedDocuments() {
      const documents = await loopar.db.getAll("Document", ["name", "type", "module", "doc_structure"]);

      const connexions = documents.reduce((acc, cur) => {
         const fields = loopar.utils.fieldList(cur.doc_structure);

         return [
            ...acc,
            ...fields.filter(field => (field.element === SELECT || field.element === FORM_TABLE) && field.data.options).map(field => {
               const options = Array.isArray(field.data.options) ? field.data.options : (field.data.options || "").split("\n")[0];
               if (options === this.__DOCTYPE__.name) {
                  return {
                     module: cur.module,
                     type: cur.type,
                     name: cur.name,
                     field: field.data.name
                  }
               }
            }).filter(e => e)
         ]
      }, []);

      let connectedDocuments = [];

      for(const document of connexions){
         const dosc = await loopar.db.getAll(document.name, ["name"], {
            "=": {
               [document.field]: this.name
            }
         });

         connectedDocuments = [...connectedDocuments, ...dosc.map(doc => {
            return {
               module: document.module,
               type: document.type,
               document: document.name,
               record: doc.name
            }
            //return `${document.name}.${doc.name}`;
         })];
      }

      return connectedDocuments;
   }

   #makeField({ field, fieldName = field.data.name, value = null } = {}) {
      const nameToGet = (name) => {
         return loopar.utils.Capitalize(name.replaceAll(/_./g, match => match.charAt(1).toUpperCase()))
      }

      if (!this.#fields[fieldName]) {
         if (field.element === FORM_TABLE) {
            const val = loopar.utils.isJSON(value) ? JSON.parse(value) : value;
            this.#fields[fieldName] = new DynamicField(
               field,
               (Array.isArray(val) && val.length > 0) ? value : this.__DOCUMENT__[fieldName]
            );
         } else {
            this.#fields[fieldName] = new DynamicField(field, value || this.__DOCUMENT__[fieldName]);
         }

         Object.defineProperty(this, `get${nameToGet(fieldName)}`, {
            get: () => {
               return this.#fields[fieldName];
            }
         });

         Object.defineProperty(this, fieldName, {
            get: () => {
               return this.#fields[fieldName].value;
            },
            set: (val) => {
               this.#fields[fieldName].value = val;
            }
         });
      }
   }

   async #makeFields(fields = this.__DOCTYPE__.STRUCTURE) {
      await Promise.all(fields.map(async (field) => {
         if (fieldIsWritable(field) || field.element === FORM_TABLE) {
            this.#makeField({ field });
         }

         await this.#makeFields(field.elements || []);
      }));
   }

   nameIsNull() {
      return (!this.name || this.name === "undefined") || this.name.length === 0;
   }

   setUniqueName() {
      if (this.nameIsNull() && (this.__IS_NEW__ || this.__DOCTYPE__.is_single) && this.getName.hidden === 1) {
         this.name = loopar.utils.randomString(12);
      }
   }

   async __ID__(){
      return this.__IS_NEW__ ? await loopar.db.getValue(this.__DOCTYPE__.name, "id", this.__DOCUMENT_NAME__) : this.id;
   }

   async save() {
      const args = arguments[0] || {};

      const validate = args.validate !== false;

      return new Promise(async resolve => {
         this.setUniqueName();
         if (validate) await this.validate();

         /*if(this.__DOCTYPE__.name === "Document"){
            await this.saveCoreFiles();
         }*/

         if (this.__IS_NEW__ || this.__DOCTYPE__.is_single) {
            await loopar.db.insertRow(this.__DOCTYPE__.name, this.stringifyValues, this.__DOCTYPE__.is_single);
            this.__DOCUMENT_NAME__ = this.name;
         } else {
            const data = this.valuesToSetDataBase;
            if (Object.keys(data).length) {
               await loopar.db.updateRow(
                  this.__DOCTYPE__.name,
                  data,
                  this.__DOCUMENT_NAME__,
                  this.__DOCTYPE__.is_single
               );
            }
         }

         const updateChild = async () => {
            const childValuesReq = this.childValuesReq;

            if (Object.keys(childValuesReq).length) {
               for (const [key, value] of Object.entries(childValuesReq)) {
                  await loopar.db.execute(`DELETE FROM \`tbl${key}\` WHERE document_parent = '${this.__DOCTYPE__.name}' AND document_parent_name = '${this.__DOCUMENT_NAME__}'`)

                  let rows = typeof value === 'string' ? JSON.parse(value) : value;
                  rows = Array.isArray(rows) ? rows : [];

                  for (const row of (rows || [])) {
                     row.document_parent = this.__DOCTYPE__.name;
                     row.document_parent_name = this.__DOCUMENT_NAME__;

                     const document = await loopar.newDocument(key, row);
                     await document.save();
                  }
               }
            }
         }

         await updateChild();

         /*const updateConnections = async () => {
            if(["Document History"].includes(this.__DOCTYPE__.name)) return;

            for (const field of Object.values(this.#fields)) {
               if (field.element === SELECT && field.options && typeof field.options === 'string') {
                  const options = (field.options || "").split("\n");
                  if (!field.value || field.value === "") continue;

                  if (options.length == 1) {
                     const toDocument = options[0];
                     const toDocumentID = await loopar.db.getValue(toDocument, "id", field.value);
                     const fromDocumentID = await this.__ID__();
                     const name = loopar.utils.hash(`${this.__DOCTYPE__.name}${fromDocumentID}${toDocument}}`);

                     const data = {
                        name: name,
                        from_document: this.__DOCTYPE__.name,
                        from_id: fromDocumentID,
                        from_name: this.__DOCUMENT_NAME__,
                        to_document: toDocument,
                        to_id: toDocumentID,
                        to_name: field.value,
                     }

                     if (!await loopar.db.getValue("Connected Document", "name", name)){
                        const connect = await loopar.newDocument("Connected Document");

                        Object.entries(data).forEach(([key, value]) => {
                           connect[key] = value;
                        });

                        await connect.save();
                     }else{
                        await loopar.db.updateRow("Connected Document", data, name);
                     }
                  }
               }
            }
         }

         await updateConnections();*/
         await this.updateHistory();
         await this.updateInstaller();

         const files = this.__DOCUMENT__.reqUploadFiles || [];
         for (const file of files) {
            const fileManager = await loopar.newDocument("File Manager");
            fileManager.reqUploadFile = file;
            fileManager.app = this.__APP__;

            await fileManager.save();
         }

         resolve();
      });
   }

   fieldsName() {

   }

   async updateHistory(action) {
      if (this.__DOCTYPE__.name !== "Document History") {
         if (!loopar.installing || (loopar.installing && this.__DOCTYPE__.name !== "Document")) {

            const id = await this.__ID__();
            const hist = await loopar.newDocument("Document History");

            hist.name = loopar.utils.randomString(15);
            hist.document_id = id;
            hist.document_name = this.__DOCUMENT_NAME__;
            hist.document = this.__DOCTYPE__.name;
            hist.action = action || (this.__IS_NEW__ ? "Created" : "Updated");
            hist.date = dayjs(new Date()).format("YYYY-MM-DD HH:mm:ss");
            hist.user = loopar.currentUser?.name;
            await hist.save({ validate: false });
         }
      }
   }

   async updateInstaller() {
      const deleteDocument = arguments[0] || false;
      if (loopar.installing) return;

      if (this.__DOCTYPE__.include_in_installer) {
         let data = {};

         if (this.__DOCTYPE__.name === "Document") {
            data = {
               id: this.id,
               name: this.name,
               module: this.module,
            }
         } else {
            data = await this.rawValues();
         }

         await loopar.updateInstaller({
            doctype: this.__DOCTYPE__,
            document: this.__DOCTYPE__.name,
            documentName: this.name,
            appName: this.__APP__,
            record: data,
            deleteRecord: deleteDocument
         });
      }
   }

   async validate() {
      const errors = Object.values(this.#fields)
         .filter(field => field.name !== ID).map(e => e.validate())
         .filter(e => !e.valid).map(e => e.message);
      
      const selectTypes = await this.validateSelectTypes();
      !loopar.installing && errors.push(...selectTypes);

      errors.length > 0 && loopar.throw({
        ...{VALIDATION_ERROR},
         message: errors.join('<br/>')
      });
   }

   async validateSelectTypes() {
      const errors = [];
      for (const field of Object.values(this.#fields)) {
         if (field.element === SELECT && field.options && typeof field.options === 'string') {
            const options = (field.options || "").split("\n");

            if (!field.value || field.value === "") continue;

            if (options.length > 1) {
               if (!options.includes(field.value)) {
                  errors.push(`The value ${field.value} for ${field.name} can only be one of the list of options`);
               }
            } else {
               const errForNotValidDocument = `The field ${field.name} does not have a valid document configured, please check the document metadata or contact an Administrator.`;

               if (options[0] === "") {
                  errors.push(errForNotValidDocument);
               } else {
                  if (await loopar.db.count(options[0]) === 0) {
                     errors.push(errForNotValidDocument);
                  } else {
                     const link = await loopar.db.count(field.options, field.value);

                     if (link === 0) {
                        errors.push(`The value ${field.value} for ${field.name} does not exist in ${field.options} Document`);
                     }
                  }
               }
            }
         }
      }

      return errors;
   }

   async delete() {
      const {updateInstaller=true, sofDelete, force, updateHistory} = arguments[0] || {};
      const connections = await this.getConnectedDocuments();
      //console.log({connections});
      /*const connections = await loopar.db.getAll("Connected Document", ["name", "from_document", "from_name"], {
         "=": {
            to_document: this.__DOCTYPE__.name,
            to_id: await this.__ID__()
            
      });*/

      const connectorMessage = connections.map(e => `<span class='fa fa-circle text-red pr-2'></span><a href="/desk/${e.module}/${e.document}/update?documentName=${e.record}" target="_blank"><strong>${e.document}</strong>.${e.record}</a>`).join("<br/>");
      const message = `Is not possible to delete ${this.__DOCTYPE__.name}.${this.name} because it is connected to:<br/> ${connectorMessage}`;

      if(connections.length > 0 && !force){
         loopar.throw({
            ...{VALIDATION_ERROR},
            message: message
         });
         return;
      }

      await loopar.db.beginTransaction();
      await loopar.db.deleteRow(this.__DOCTYPE__.name, this.__DOCUMENT_NAME__, sofDelete);
      updateHistory && await this.updateHistory("Deleted");

      /*const deleteConnectedDocuments = async () => {
         const connectedDocuments = await loopar.db.getAll("Connected Document", ["name"], {
            "=": {
               from_document: this.__DOCTYPE__.name,
               from_id: await this.__ID__()
            }
         });

         for (const doc of connectedDocuments) {
            await loopar.db.deleteRow("Connected Document", doc.name);
         }
      }

      await deleteConnectedDocuments();*/

      await loopar.db.endTransaction();

      if (updateInstaller && this.updateInstaller && typeof this.updateInstaller === 'function') {
         await this.updateInstaller(true);
      }

      await this.trigger('afterDelete', this);
   }

   async __data__() {
      return {
         __DOCTYPE__: this.__DOCTYPE__,
         __DOCUMENT_NAME__: this.__DOCUMENT_NAME__,
         __DOCUMENT__: await this.values(),
         //__DOCUMENT__: this.__DOCUMENT__,
         __IS_NEW__: this.__IS_NEW__,
      }
   }

   async values() {
      const value = async (field) => {
         if (field.name === this.fieldDocStructure) {
            return field.value ? JSON.stringify(field.value.filter(field => (field.data || []).name !== ID)) : "[]";
         } else if (field.element === FORM_TABLE) {
            return await this.getChildValues(field.options);
         } else if (field.element === PASSWORD) {
            return field.value && field.value.length > 0 ? this.protectedPassword : "";
         } else {
            return field.stringifyValue;
         }
      }

      return Object.values(this.#fields).reduce(async (acc, cur) => {
         return { ...await acc, [cur.name]: await value(cur) }
      }, {});
   }

   async rawValues() {
      return Object.values(this.#fields).reduce(async (acc, cur) => {
         return { ...await acc, [cur.name]: cur.value }
      }, {});
   }

   async getChildValues(field) {
      return await loopar.getList(field, {
         filters: {
            "=": {
               document_parent: this.__DOCTYPE__.name,
               document_parent_name: this.__DOCUMENT_NAME__
            }
         }
      })
   }

   get stringifyValues() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID && field.element !== FORM_TABLE)
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue }), {});
   }

   get valuesToSetDataBase() {
      return Object.values(this.#fields)
         .filter(field => {
            if (field.name === ID) return false;

            if ((this.__IS_NEW__ && field.set_only_time) || field.element === FORM_TABLE) return false;

            if (field.type === PASSWORD) {
               return field.value !== this.protectedPassword;
            }

            return true;
         })
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue }), {});
   }

   get childValuesReq() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID && field.element === FORM_TABLE)
         .reduce((acc, cur) => ({ ...acc, [cur.options]: cur.stringifyValue }), {});
   }

   get formattedValues() {
      return Object.values(this.#fields)
         .filter(field => field.name !== ID)
         .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.formattedValue }), {});
   }
}