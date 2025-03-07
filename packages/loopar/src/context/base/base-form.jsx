import {loopar} from 'loopar';
import BaseDocument from "@context/base/base-document";
import { dataInterface } from '@global/element-definition';
import { useWorkspace } from "@workspace/workspace-provider"; 

export default class BaseForm extends BaseDocument {
  tagName = "form";
  formFields = {};
  hasSidebar = true;
  lastData = null;
  __FORM_REFS__ = {};
  #Form = null;
  //static contextType = useWorkspace;

  save() {
    this.send({ action: this.props.meta.action });
  }

  // hydrate() {
  //   loopar.rootApp.updateDocument(this.props.key, this.getFormValues(), false);
  // }

  send({ action, params={}, ...options } = {}) {
    //options = typeof options === 'string' ? { action: options } : options;
    this.validate();
    
    /*if (!this.notRequireChanges && !this.props.__IS_NEW__ && (!this.lastData || (this.lastData && this.lastData === JSON.stringify(this.getFormValues)))) {
      this.lastData = JSON.stringify(this.getFormValues);
      loopar.notify("No changes to save", "warning");
      return;
    }*/
    

    //return new Promise((resolve, reject) => {
    loopar.send({
      action: action,
      params: {...this.params, ...params},
      body: this.#getFormData(true),
      success: r => {
        if (r && r.success) {
          //this.lastData = JSON.stringify(this.getFormValues);
          //this.context.refresh();
          /*if (loopar.rootApp && loopar.rootApp.refresh) {
            loopar.rootApp.refresh().then(() => {
              loopar.notify(r.message);
            });*/
          //} else {
            //window.location.reload();
          // }
        }

        options.success && options.success(r);
        //resolve(r);
      },
      error: r => {
        options.error && options.error(r);
      },
      freeze: true
    });
  }

  get params() {
    return {
      name: this.props.meta.__DOCUMENT_NAME__,
    }
  }

  validate() {
    const fields = this.__FIELDS__;
    const errors = [];
    Object.entries(this.Form.watch()).reduce((obj, [key, value]) => {
      const field = fields.find(f => f.data?.name === key);
      if (!field || !this.get(key)) return obj;
      field.value = value;
      
      if([FORM_TABLE].includes(field.def.element)) {
        /*const TableInput = this.get(key);

        console.log(["TableInput", TableInput]);
        const tableErrors = TableInput?.validate();

        if(tableErrors.length > 0) {
          errors.push(...tableErrors);
        }*/
      }else{
        field.element = field.def.element;
        const validator = dataInterface(field, value).validate();
        if (!validator.valid) {
          errors.push({
            field: field.data.name,
            message: validator.message
          });
        }
      }
    }, {});

    if(errors.length > 0) {
      errors.forEach(e => this.setError(e.field, { message: e.message}));
      loopar.throw({
        type: 'error',
        title: 'Validation error',
        message: errors.map(e => e.message).join('<br/>')
      });
    }
  }

  getField(name) {
    return this.formFields.defaultValues[name] || null;
  }

  getValue(name) {
    return this.#getFormValues()[name];
  }

  getFormValues(toSave = false) {
    return this.#getFormValues(toSave);
  }

  #getFormValues(toSave = false) {
    if(!this.Form)  return this.meta.__DOCUMENT__;
    
    const fields = this.__FIELDS__;
    return Object.entries(this.Form.watch()).reduce((obj, [name, value]) => {
      const field = fields.find(f => f.data?.name === name);

      if (!field) return obj;

      if ([FILE_INPUT, IMAGE_INPUT].includes(field.def.element)) {
        const files = Array.isArray(value) ? value : [];
        const metaFiles = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          if (file.rawFile && file.rawFile instanceof File) {
            metaFiles.push({
              name: file.rawFile.name,
              size: file.rawFile.size,
              type: file.rawFile.type,
            });
            obj[name + "[" + i + "]"] = files[i].rawFile;
          }
        }
      
        obj[name] = metaFiles.length > 0 ? JSON.stringify(metaFiles) : value;
        return obj
      }

      if([FORM_TABLE].includes(field.def.element) && toSave) {
        obj[name] = JSON.stringify(value.rows || []);
        return obj;
      }

      if([CHECKBOX, SWITCH].includes(field.def.element)) {
        obj[name] = value ? 1 : 0;
        return obj;
      }

      obj[name] = value;
      return obj;
    }, {});
  }

  #getFormData(toSave) {
    const [data, formData] = [this.getFormValues(toSave), new FormData()];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = (typeof data[key] === 'object' && !(data[key] instanceof File)) ? JSON.stringify(data[key]) : data[key];
        formData.append(key, value);
      }
      //data.hasOwnProperty(key) && formData.append(key, data[key]);
    }

    return formData;
  }

  set Form(Form) {
    this.#Form = Form;
  }

  get Form() {
    return this.#Form;
  }

  setError(name, error) {
    this.Form.control.setError(name, error);
  }

  setValue(name, value) {
    /*const field = this.getField(name);
    field && field.val(value);*/
  }
}