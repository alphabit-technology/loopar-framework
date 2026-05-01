import { BaseDocument, fileManage, loopar, Helpers } from "loopar";3
import { pluralize } from "inflection";

export default class Entity extends BaseDocument {
  __CORE_FILES__ = [];

  get is_builder() {return true};
  
  constructor(props) {
    super(props);
  }

  entityIsSingle() {
    return (["Page", "Form", "Report", "View", "Controller"].includes(this.getEntityType()) || this.is_single) ? 1 : 0;
  }

  validateEntityName() {
    const entityName = this.name;

    if (entityName.length < 3) {
      loopar.throw('Entity name must be at least 3 characters long.');
    }

    if (entityName.length > 64) {
      loopar.throw('Entity name must be at most 64 characters long.');
    }

    if (!/^[a-zA-Z0-9 ]+$/.test(entityName)) {
      loopar.throw('Entity name must contain only letters, numbers and spaces.');
    }

    if (/^[0-9]/.test(entityName)) {
      loopar.throw('Entity name must not start with a number.');
    }

    if (!/^[A-Z]/.test(entityName)) {
      loopar.throw('Entity name must start with an uppercase letter (PascalCase convention).');
    }

    const words = entityName.split(' ');
    for (const word of words) {
      if (!/^[A-Z][a-zA-Z0-9]*$/.test(word)) {
        loopar.throw('Each word in Entity name must start with uppercase letter.');
      }
    }
  }

  validateUniqueEntityName() {
    if (!loopar.installing && this.__IS_NEW__) {
      const ref = loopar.getRef(this.name, false);
      
      if (ref) {
        loopar.throw(
          `An entity with a similar name already exists: "${ref.__NAME__}" ` +
          `(${ref.__ENTITY__} in app "${ref.__APP__}"). ` +
          `Names like "${this.name}", "${ref.__NAME__}", and similar variations are considered duplicates.`
        );
      }
    }
  }

  async save() {
    this.is_single = this.entityIsSingle();
    this.is_static = 0;

    const args = arguments[0] || {};
    const validate = args.validate !== false;

    await this.fixFields(this.doc_structure);

    if (validate) {
      this.validateFields();
      this.validateEntityName();
      this.validateUniqueEntityName();

      if(!loopar.installing){
        await this.validateLinkedDocument(SELECT);
        await this.validateLinkedDocument(FORM_TABLE);
      }
    }

    if (!loopar.installing) await loopar.db.beginTransaction();

    if (this.isDBEntity()) {
      await loopar.db.makeTable(this.name, this.doc_structure);
    }

    args.save != false && await super.save(arguments[0] || {});
    
    if (!loopar.installing) {
      await this.save__CORE_FILES__();
      await loopar.db.endTransaction();
      await this.__build__();
    }
  }

  async initialize() {
    this.is_single = this.entityIsSingle();
    this.is_static = 0;
   
    await this.fixFields(this.doc_structure);
    await loopar.db.makeTable("Entity", this.doc_structure);
  }

  async save__CORE_FILES__() {
    for (const file of this.__CORE_FILES__ || []) {
      const fileManager = await loopar.newDocument("File Manager");

      fileManager.reqUploadFile = file;
      fileManager.app = this.__APP__;
      await fileManager.save();
    }

    this.__CORE_FILES__ = [];
  }

  clientFieldsList(fields = this.doc_structure) {
    return loopar.utils.fieldList(fields);
  }

  writableFieldsList({ includeFormTable = false } = {}) {
    return this.clientFieldsList().filter(field => fieldIsWritable(field) && (includeFormTable || field.element !== FORM_TABLE));
  }

  getSpecialMetaFields() {
    return {
      namedContainer: {
        element: ROW,
        data: {
          name: 'name_and_status_container',
        },
        elements: []
      },
      elementsNamed: [
        {
          element: INPUT,
          data: {
            name: 'name',
            label: 'Name',
            required: 1,
            type: 'text',
            in_list_view: 1,
            set_only_time: 1,
            unique: 1,
            searchable: 1
          }
        },
        {
          element: SELECT,
          data: {
            name: '__document_status__',
            label: 'Status',
            options: 'Active\nInactive\nDraft\nPending\nApproved\nRejected\nArchived\nDeleted',
            default_value: 'Active',
            hidden: 1,
          }
        },
        {
          element: ID,
          data: {
            name: 'id',
            label: 'ID',
            type: INTEGER,
            required: 1,
            in_list_view: 0,
            hidden: 1
          }
        }
      ]
    };
  }

  insertField(field, targetField, position = 'after') {
    const fields = this.doc_structure;

    const insertField = (fields, field, targetField, position = 'after') => {
      for (let i = 0; i < fields.length; i++) {
        if (fields[i].data.name === targetField) {
          if (position === 'after') {
            fields.splice(i + 1, 0, field);
          } else if (position === 'before') {
            fields.splice(i, 0, field);
          }
          return;
        } else if (fields[i].elements && fields[i].elements.length > 0) {
          insertField(fields[i].elements, field, targetField, position);
        }
      }
    }

    insertField(fields, field, targetField, position);
  }

  getEntityType(){
    return this.__ENTITY__.build || this.__ENTITY__.name || "Entity";
  }

  isDBEntity(){
    return ["Entity", "Builder"].includes(this.getEntityType()) && !this.entityIsSingle();
  }

  async fixFields() {
    const __IS_NEW__ = this.__IS_NEW__;

    const updateOrInsertField = ({ fields = this.doc_structure, field, position = null, target = null }) => {
      let foundField = false;
      let targetFound = fields;

      const searchAndInsert = (items) => {
        items.forEach(f => {
          if (target && f.data.name === target) {
            targetFound = f.elements || null;
          }

          if (field.data.name === f.data.name) {
            foundField = true;
            Object.assign(f.data, field.data);
          } else if (f.elements && f.elements.length > 0) {
            searchAndInsert(f.elements);
          }
        });
      };

      searchAndInsert(fields);

      if (!foundField && (position === 'after' || position === null)) {
        targetFound.push(field);
      } else if (!foundField && position === 'before') {
        targetFound.unshift(field);
      }

      foundField = false;
      this.doc_structure = fields;
    };

    const removeField = ({ fields = this.doc_structure, fieldName }) => {
      const removeField = (fields) => {
        fields.forEach((field, index) => {
          if (field.data.name === fieldName) {
            fields.splice(index, 1);
          } else if (field.elements && field.elements.length > 0) {
            removeField(field.elements);
          }
        });
      };

      removeField(fields);

      this.doc_structure = fields;
    };

    const getField = (fieldName) => {
      const getField = (fields) => {
        for (const field of fields) {
          if (field.data.name === fieldName) {
            return field;
          } else if (field.elements && field.elements.length > 0) {
            const result = getField(field.elements);
            if (result) {
              return result;
            }
          }
        }
      };

      return getField(this.doc_structure);
    };

    const fixFieldData = async (field) => {
      const updatedData = {};
      const nullValues = [null, undefined, "", "null", "undefined", 0, "0"];

      for (const [key, value] of Object.entries(field.data || {})) {
        //field.id ??= loopar.Helpers.randomString(12);
        if (key === "name" && nullValues.includes(value)) {
          updatedData[key] = Helpers.randomString(12);
        } else {
          updatedData[key] = value;
        }

        if (__IS_NEW__ && key === "required" && field.data.required) {
          updatedData[key] = 1;
        }

        /*if (key === "background_image" && value) {
          const files = value;
          const filesToSave = [];

          for (const file of files || []) {
            if (typeof file === "string") continue;

            const typeMatches = file.src.match(/^data:(.*);base64,/);
            const isFile = typeMatches ? typeMatches[1] : null;

            if (isFile) {
              const binaryData = Buffer.from(file.src.split(';base64,')[1], 'base64');
              file.src = "public/" + file.name

              this.__CORE_FILES__.push({
                buffer: binaryData,
                originalname: file.name,
                size: binaryData.length,
              });

              filesToSave.push({
                name: file.name,
                size: binaryData.length,
                src: file.src,
              });
            }else{
              filesToSave.push(file);
            }
          }

          updatedData[key] = JSON.stringify(filesToSave);
        }*/

        if ((key === "background_color" || key === "color_overlay") && JSON.stringify(value) === '{"color":"#000000","alpha":0.5}') {
          delete updatedData[key];
        }
      }

      return updatedData;
    };

    const fixElements = async (elements = []) => {
      for (const field of elements) {
        field.data = await fixFieldData(field);

        if (field.elements && field.elements.length > 0) {
          await fixElements(field.elements);
        }
      }

      /*elements.forEach(async field => {
         await fixFieldData(field);
         if (field.elements && field.elements.length > 0) {
            await fixElements(field.elements);
         }
      });*/

      this.doc_structure = elements;
    };

    if (this.isDBEntity() && !loopar.installing) {
      const specialFields = this.getSpecialMetaFields();

      updateOrInsertField({ field: specialFields.namedContainer, position: 'before' });
      specialFields.elementsNamed.map(field => {
        updateOrInsertField({ field, position: 'after', target: specialFields.namedContainer.data.name });
      });

      if (getField(specialFields.namedContainer.data.name).elements.length === 0) {
        removeField({ fieldName: specialFields.namedContainer.data.name });
      }

      if (this.is_child) {
        updateOrInsertField({
          field: {
            element: INPUT,
            data: { name: "parent_document", label: "Parent Entity", type: INTEGER, hidden: 1 }
          }, position: 'before'
        });

        updateOrInsertField({
          field: {
            element: INPUT,
            data: { name: "parent_id", label: "Parent ID", type: INTEGER, hidden: 1 }
          }, position: 'before'
        });
      }
    } 

    await fixElements(this.doc_structure);
  }

  async delete() {
    const ref = loopar.getRef(this.name);
    if (ref.__APP__ === 'loopar' && ref.__TYPE__ == "Entity") {
      loopar.throw(`You can not delete Entity:${this.name}, it is a core Entity.`);
      return;
    }

    await super.delete(...arguments);

    if(!loopar.installing){
      this.__document_status__ = "Deleted";
      await this.makeJSON();
    }
  }

  validateFieldName(name) {
    if (!name) return;
    const errMessage = `Field name <strong>"${name}"</strong> is not valid. <br/>`;
    
    if (name.length < 2 && name !== 'id') {
      loopar.throw(`${errMessage}Field name must be at least 2 characters long.`);
    }
  
    if (name.length > 64) {
      loopar.throw(`${errMessage}Field name must be at most 64 characters long.`);
    }
  
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)) {
      loopar.throw(`${errMessage}Field name must start with a letter or underscore, and contain only letters, numbers and underscores.`);
    }
  }

  validateFields() {
    const fields = this.clientFieldsList();

    for (const field of fields) {
      if(!fieldIsWritable(field)) continue;
      this.validateFieldName(field.data.name);
    }

    const duplicates = fields.map(field => field.data.name).filter((value, index, self) => value && self.indexOf(value) !== index);

    if (duplicates.length) {
      loopar.throw(`Duplicate field names:<br/> ${duplicates.join(', ')}`);
    }
  }

  async validateLinkedDocument(type) {
    const errors = [];
    const fields = this.clientFieldsList();
    for (const field of fields) {
      if (field.element === type && field.data.options && typeof field.data.options === "string") {
        const options = (field.data.options || "").split("\n");

        if (options.length === 1 && options[0] !== "") {
          const name = options[0].split(":")[0];
          const ref = loopar.getRef(name);
          if(!ref) continue;

          if (await loopar.db.count(ref.__ENTITY__, name) === 0) {
            errors.push(`${ref.__ENTITY__} ${name} is not a valid Entity for ${field.data.name}, please check the options.`);
          } else if (type === FORM_TABLE) {
            const isSingle = await loopar.db.getValue(ref.__ENTITY__, "is_single", name);
            if (isSingle) {
              errors.push(`Entity ${name} is a single Entity, please use a Entity with multiple records.`);
            }

            const isChild = await loopar.db.getValue(ref.__ENTITY__, "is_child", name);

            if (isChild !== 1) {
              errors.push(`${ref.__ENTITY__} ${name} is not a child Entity, please use a child Entity.`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      loopar.throw(errors.join("<br/>"));
    }
  }

  async targetApp() {
    return await loopar.db.getValue("Module", "app_name", this.module);
  }

  async modulePath() {
    const type = this.getEntityType();
    return loopar.makePath("apps", await this.targetApp(), "modules", this.module, pluralize(type));
  }

  async documentPath() {
    return loopar.makePath(await this.modulePath(), this.name);
  }

  async clientPath() {
    return loopar.makePath(await this.documentPath(), 'client');
  }

  async __build__() {
    await this.makeDocumentStructure();
    await this.makeViews();
    await this.makeJSON();
    !loopar.installing && await loopar.build();
  }

  async makeDocumentStructure() {
    await fileManage.makeFolder(await this.documentPath(), 'client');
  }

  async __meta__(withData = true) {
    const meta = await super.__meta__(withData);
    const spacing = loopar.__installed__ ? await loopar.db.getDoc("App", await this.targetApp(), ["spacing", "col_padding", "col_margin"]) : {};

    return {
      ...meta,
      spacing,
    }
  }

  async makeViews() {
    const documentPath = await this.documentPath();
    const clientPath = await this.clientPath();

    /*Entity Model*/
    await fileManage.makeClass(documentPath, this.name, {
      IMPORTS: {
        'BaseDocument': 'loopar',
      },
      EXTENDS: 'BaseDocument'
    });
    /*Entity Model*/

    const type = this.getEntityType();
    const extendController = (["Single", "View", "Page", "Form", "Report"].includes(type) ? type : "Base") + "Controller";
    
    await fileManage.makeClass(documentPath, `${this.name}Controller`, {
      IMPORTS: {
        [extendController]: 'loopar',
      },
      EXTENDS: extendController
    });
    /*Entity Controller*/

    const makeView = async (view, context = view) => {
      const importContext = `${Helpers.Capitalize(context)}Context`;
      const viewName = this.name + Helpers.Capitalize(view);

      await fileManage.makeClass(clientPath, viewName, {
        IMPORTS: {
          [importContext]: `@context/${context}-context`
        },
        EXTENDS: importContext
      }, 'default', "jsx");
    }

    if (type === "Entity") {
      for (const context of ["list", "form", "view", "report"]) {
        await makeView(context);
      }
    } else if (type === "Builder") {
      for (const context of ["list", "form"]) {
        await makeView(context);
      }
    } else {
      await makeView(type.toLowerCase(), type.toLowerCase());
    }
  }

  /**installer**/
  
  async makeJSON() {
    const meta = await this.__meta__();
    await fileManage.setConfigFile(this.name, { ...meta.data, ...{ __ENTITY__: meta.Entity.name } }, await this.documentPath());

    const app = await loopar.getDocument("App", await this.targetApp());
    app.buildInstaller()
  }

  async getOrphanColumns(){
    if(this.__IS_NEW__) return []

    return await loopar.db.getOrphanColumns(this.name, {});
  }
}

export {
  Entity
}