'use strict'
import DynamicField from './dynamic-field.js';
import { loopar, documentManage, fileManage} from 'loopar';

export default class CoreDocument {
  #fields = {};
  documentType = "Entity";
  fieldDocStructure = 'doc_structure';
  protectedPassword = "********";

  constructor(props) {
    Object.assign(this, props);
  }

  get fields() {
    return this.#fields;
  }

  async onLoad() {

  }

  trigger(event, ...args) {
    if (this[event] && typeof this[event] === 'function') {
      this[event](event, ...args);
    }
  }

  async setApp() {
    const __REF__ = this.__ENTITY__.__REF__;
    if (loopar.installing) {
      this.__APP__ = loopar.installingApp;
      return;
    }

    if (this.__ENTITY__.name === "App") {
      /**
       * If is an Entity type App, the app name is the same as the document name
       */
      this.__APP__ = this.name;
    } else if (this.isBuilder) {
      /**
       * If is a Entity type Entity, the app name is the same as the module name
       */
      if (this.name === "Entity") {
        this.__APP__ = "loopar";
      } else {
        this.__APP__ ??= await loopar.db.getValue("Module", "app_name", this.module);
      }
    } else if (this.__ENTITY__.name === "Module") {
      this.__APP__ = this.app_name;
    } else {
      if (__REF__?.__APP__) {
        this.__APP__ = __REF__.__APP__;
      } else {
        this.__APP__ ??= await loopar.db.getValue("Module", "app_name", this.__ENTITY__.module);
      }
    }
  }

  async __init__() {
    await this.#makeFields(JSON.parse(this.__ENTITY__[this.fieldDocStructure]));
    //this.__ENTITY__.STRUCTURE = JSON.parse(this.__ENTITY__[this.fieldDocStructure]).filter(field => field.data.name !== ID);

    if (this.__DOCUMENT__ && this.__DOCUMENT__[this.fieldDocStructure]) {
      this.__DOCUMENT__[this.fieldDocStructure] = JSON.stringify(
        JSON.parse(
          this.__DOCUMENT__[this.fieldDocStructure]).filter(field => (field.data || {}).name !== ID
          )
      );
    }

    await this.setApp();
    await this.onLoad();
  }

  async getConnectedDocuments() {
    const refs = Object.values(loopar.getRefs());
    const relatedEntities = [];
    for (const ref of refs) {
      const ent = await fileManage.getConfigFile(ref.__NAME__, ref.__ROOT__);

      const fields = loopar.utils.fieldList(ent.doc_structure);

      fields.filter(field => (field.element === SELECT || field.element === FORM_TABLE) && field.data.options).map(field => {
        const options = Array.isArray(field.data.options) ? field.data.options : (field.data.options || "").split("\n")[0];
        if (options === this.__ENTITY__.name) {
          relatedEntities.push({
            is_single: ref.is_single,
            entity: ref.__NAME__,
            field: field.data.name,
          })
        }
      });
      
    }

    const rels = []
    for (const r of relatedEntities) {
      const docs = await loopar.db.getAll(r.entity, ["name"], {
        "=": {
          [r.field]: this.name
        }
      }, { isSingle: r.is_single });

      rels.push(...docs.filter(doc => doc.name).map(doc => {
        return {
          entity: r.entity,
          name: doc.name,
        }
      }));
    }

    return rels
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
        if (fieldName === "doc_structure") {
          //console.log("doc_structure", value, this.__DOCUMENT__[fieldName])
        }

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

  getDocypeStructure() {
    return JSON.parse(this.__ENTITY__[this.fieldDocStructure]).filter(field => field.data.name !== ID);
  }

  async #makeFields(fields = this.getDocypeStructure()) {
    const entityFields = this.__ENTITY__.__REF__.__FIELDS__;

    await Promise.all(fields.map(async (field) => {
      if ((fieldIsWritable(field) || field.element === FORM_TABLE) && entityFields.includes(field.data.name)) {
        this.#makeField({ field });
      }

      await this.#makeFields(field.elements || []);
    }));
  }

  nameIsNull() {
    return (!this.name || this.name === "undefined") || this.name.length === 0;
  }

  setUniqueName() {
    if (this.nameIsNull() && (this.__IS_NEW__ || this.__ENTITY__.is_single) && this.getName?.hidden === 1) {
      this.name = loopar.utils.randomString(12);
    }
  }

  async __ID__() {
    return this.__IS_NEW__ ? await loopar.db.getValue(this.__ENTITY__.name, "id", this.__DOCUMENT_NAME__) : this.id;
  }

  async deleteChildRecords(force=false) {
    const ID = await this.__ID__();
    const childValuesReq = this.childValuesReq;

    if (Object.keys(childValuesReq).length === 0) return;

    for (const [key, value] of Object.entries(childValuesReq)) {
      const values = loopar.utils.isJSON(value) ? JSON.parse(value) : Array.isArray(value) ? value : null;

      if(values || force){
        await loopar.db.knex(loopar.db.literalTableName(key)).where({
          //parent_document: this.__ENTITY__.name,
          parent_id: ID
        }).del();
      }
    }
  }

  async save() {
    const args = arguments[0] || {};
    const validate = args.validate !== false;

    async function updateRows(Ent, rows, parentType, parentId) {
      const nextId = await loopar.db.nextId(Ent);
      for (const [index, row] of rows.sort((a, b) => a.id - b.id).entries()) {
        row.id = nextId + index;
        row.name = loopar.utils.randomString(15);
        row.parent_document = parentType;
        row.parent_id = parentId;

        const document = await loopar.newDocument(Ent, row);
        await document.save();
      }
    }
    async function updateChildRecords(childValuesReq, parentType, parentId) {
      for (const [key, value] of Object.entries(childValuesReq)) {
        const rows = loopar.utils.isJSON(value) ? JSON.parse(value) : Array.isArray(value) ? value : null;
        if(!rows) continue;

        await updateRows(key, rows, parentType, parentId);
      }
    }

    return new Promise(async (resolve) => {
      this.setUniqueName();
      if (validate) await this.validate();

      if (this.__IS_NEW__ || this.__ENTITY__.is_single) {
        await loopar.db.insertRow(this.__ENTITY__.name, this.stringifyValues, this.__ENTITY__.is_single);
        this.__DOCUMENT_NAME__ = this.name;
      } else {
        const data = this.valuesToSetDataBase;

        if (Object.keys(data).length) {
          await loopar.db.updateRow(
            this.__ENTITY__.name,
            data,
            this.__DOCUMENT_NAME__,
            this.__ENTITY__.is_single
          );
        }
      }

      //if (!loopar.installing) {
      const childValuesReq = this.childValuesReq;

      if (Object.keys(childValuesReq).length) {
        await this.deleteChildRecords();
        await updateChildRecords(childValuesReq, this.__ENTITY__.name, await this.__ID__());
      }
      //}

      await this.updateHistory();

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
    if (loopar.installing) return;
    if (this.__ENTITY__.name !== "Document History") {
      if (!loopar.installing || (loopar.installing && this.__ENTITY__.name !== "Entity")) {

        const id = await this.__ID__();
        const hist = await loopar.newDocument("Document History");

        hist.name = loopar.utils.randomString(15);
        hist.document_id = id;
        hist.document_name = this.__DOCUMENT_NAME__;
        hist.document = this.__ENTITY__.name;
        hist.action = action || (this.__IS_NEW__ ? "Created" : "Updated");
        hist.date = dayjs(new Date())//.format("YYYY-MM-DD HH:mm:ss");
        hist.user = loopar.currentUser?.name;
        await hist.save({ validate: false });
      }
    }
  }

  async validate() {
    const errors = Object.values(this.#fields)
      .filter(field => field.name !== ID).map(e => e.validate())
      .filter(e => !e.valid).map(e => e.message);

    const selectTypes = await this.validateLinkDocuments();
    !loopar.installing && errors.push(...selectTypes);

    errors.length > 0 && loopar.throw(errors.join('<br/>'));
  }

  async validateLinkDocuments() {
    const errors = [];
    for (const field of Object.values(this.#fields)) {
      if (field.element === SELECT && field.options && typeof field.options === 'string') {
        const value = field.formattedValue;
        const options = (field.options || "").split("\n");

        if (!value || value === "") continue;

        if (options.length > 1) {
          if (!options.includes(value)) {
            errors.push(`The value ${value} for ${field.name} can only be one of the list of options`);
          }
        } else {
          const errForNotValidDocument = `The field ${field.name} does not have a valid document configured, please check the document metadata or contact an Administrator.`;

          if (options[0] === "") {
            errors.push(errForNotValidDocument);
          } else {
            if (await loopar.db.hastEntity(options[0]) === 0) {
              errors.push(errForNotValidDocument);
            } else {
              const link = await loopar.db.hastEntity(field.options, value);

              if (link === 0) {
                errors.push(`The value ${value} for ${field.name} does not exist in ${field.options} Entity`);
              }
            }
          }
        }
      }
    }

    return errors;
  }

  async delete() {
    const { sofDelete, force, updateHistory } = arguments[0] || {};
    const connections = await this.getConnectedDocuments();

    let message = connections.map((e, index) => {
      return `<a href='/desk/${e.entity}/update?name=${e.name}'>${index+1}: <strong>${e.entity}</strong>.${e.name}</a>`;
    }).join("<br/>");
    
    message = `<h2>Is not possible to delete ${this.__ENTITY__.name}.${this.name} because it is connected to:</h2><br/> ${message}`;

    if (connections.length > 0 && !force) {
      loopar.throw({
        ...{ VALIDATION_ERROR },
        message: message
      });
      return;
    }

    await loopar.db.beginTransaction();
    await this.deleteChildRecords(true);
    await loopar.db.deleteRow(this.__ENTITY__.name, this.__DOCUMENT_NAME__, sofDelete);
    updateHistory && await this.updateHistory("Deleted");

    await loopar.db.endTransaction();
    console.log(["Deleting", this.__ENTITY__.name, this.name]);

    await this.trigger('afterDelete', this);
  }

  async __data__() {
    const entity = this.__ENTITY__;

    const isDesigner = (elements) => {
      for (const element of elements) {
        if (element.element == DESIGNER) return true;

        if (element.elements) {
          return isDesigner(element.elements);
        }
      }
    }

    if (!isDesigner(JSON.parse(entity.doc_structure))) entity.doc_structure = JSON.stringify(documentManage.parseDocStructure(JSON.parse(entity.doc_structure)));

    const __ENTITY__ = this.__ENTITY__;
    delete __ENTITY__.__REF__;
    return {
      __ENTITY__: __ENTITY__,
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
      }
      /*else if (field.element === SELECT) {
        if (field.options && typeof field.options === 'string') {
          const options = (field.options || "").split("\n");

          if (options.length === 1) {
            const value = await loopar.db.getValue(field.options, "name", field.value);
            return JSON.stringify({ option: field.value, title: value });
          }
        }

        return JSON.stringify({ option: field.value, value: field.value });
      }*/
      else if (field.element === PASSWORD) {
        return field.value && field.value.length > 0 ? this.protectedPassword : "";
      } else {
        return field.stringifyValue;
      }
    }

    return Object.values(this.#fields).reduce(async (acc, cur) => {
      return { ...await acc, [cur.name]: await value(cur) }
    }, {});
  }

  /*async rawValues() {
     return Object.values(this.#fields).reduce(async (acc, cur) => {
        return { ...await acc, [cur.name]: cur.value }
     }, {});
  }*/

  async rawValues() {
    const value = async (field) => {
      if (field.name === this.fieldDocStructure) {
        return field.value ? JSON.stringify(field.value.filter(field => (field.data || []).name !== ID)) : "[]";
      } else if (field.element === FORM_TABLE) {
        return await this.getChildRawValues(field.options);
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

  async getChildValues(field) {
    return await loopar.getList(field, {
      filters: {
        "=": {
          //parent_document: this.__ENTITY__.id,
          parent_id: await this.__ID__()
        }
      }
    })
  }

  async getChildRawValues(field) {
    return await loopar.db.getAll(field, ["*"], {
      "=": {
        //parent_document: this.__ENTITY__.name,
        parent_id: await this.__ID__()
      }
    })
  }

  get stringifyValues() {
    return Object.values(this.#fields)
      .filter(field => field.element !== FORM_TABLE)
      //.filter(field => (field.element === PASSWORD && field.value != this.protectedPassword))
      .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue }), {});
  }

  get valuesToSetDataBase() {
    return Object.values(this.#fields).filter(field => {
      if ((this.__IS_NEW__ && field.set_only_time) || field.element === FORM_TABLE) return false;

      if (field.type === PASSWORD) {
        return field.value !== this.protectedPassword;
      }

      return true;
    }).reduce((acc, cur) => ({ ...acc, [cur.name]: cur.stringifyValue }), {});
  }

  get childValuesReq() {
    return Object.values(this.#fields)
      .filter(field => field.name !== ID && field.element === FORM_TABLE)
      .reduce((acc, cur) => ({ ...acc, [cur.options]: cur.value }), {});
  }

  get formattedValues() {
    return Object.values(this.#fields)
      //.filter(field => field.name !== ID)
      .reduce((acc, cur) => ({ ...acc, [cur.name]: cur.formattedValue }), {});
  }
}