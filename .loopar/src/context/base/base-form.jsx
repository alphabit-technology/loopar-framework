import loopar from '$loopar';
import BaseDocument from "$context/base/base-document";
import http from '$tools/router/http';
import { dataInterface } from '@global/element-definition';
import { ta } from 'date-fns/locale';
//import { data } from 'autoprefixer';

export default class BaseForm extends BaseDocument {
  tagName = "form";
  formFields = {};
  hasSidebar = true;
  lastData = null;
  #Form = null;

  constructor(props) {
    super(props);
  }

  save() {
    this.send({ action: this.props.meta.action });
  }

  hydrate() {
    loopar.rootApp.updateDocument(this.props.key, this.formValues, false);
  }

  send(options = { action: this.props.action }) {
    options = typeof options === 'string' ? { action: options } : options;
    this.validate();

    //console.log('formValues', JSON.parse(this.formValues.doc_structure));

    /*console.log({
       isNew: this.props.__IS_NEW__,
       lastData: JSON.parse(this.lastData),
       formValues: this.formValues,
       test: (!this.props.__IS_NEW__ && (!this.lastData || (this.lastData && this.lastData === JSON.stringify(this.formValues))))
    });*/

    /*if (!this.notRequireChanges && !this.props.__IS_NEW__ && (!this.lastData || (this.lastData && this.lastData === JSON.stringify(this.formValues)))) {
      this.lastData = JSON.stringify(this.formValues);
      loopar.notify("No changes to save", "warning");
      return;
    }*/

    return new Promise((resolve, reject) => {
      http.send({
        action: options.action,
        params: this.params,
        body: this.#formData(),
        success: r => {
          if (r && r.success) {
            //this.lastData = JSON.stringify(this.formValues);
            if (loopar.rootApp && loopar.rootApp.refresh) {
              loopar.rootApp.refresh().then(() => {
                loopar.notify(r.message);
              });
            } else {
              //window.location.reload();
            }
          } else {
            loopar.notify(r.message, "error");
          }

          options.success && options.success(r);
          resolve(r);
        },
        error: r => {
          options.error && options.error(r);
        },
        freeze: true
      });
    });
  }

  get params() {
    return {
      documentName: this.props.meta.__DOCUMENT_NAME__,
    }
  }

  validate() {
    //console.log(["validate", this.formFields.defaultValues, this.Form.watch()])
    const fields = this.__FIELDS__;
    const errors = [];
    Object.entries(this.Form.watch()).reduce((obj, [key, value]) => {
      const field = fields.find(f => f.data?.name === key);
      if (!field) return obj;

      field.value = value;
      

      if([FORM_TABLE].includes(field.def.element)) {
        const TableInput = this.get(key);

        const tableErrors = TableInput?.validate();

        /*if(tableErrors.length > 0) {
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
      //console.log(dataInterface(field, value).validate())

      /*if ([FILE_INPUT, IMAGE_INPUT].includes(field.def.element)) {
        const files = value;
        const metaFiles = [];

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          if (file instanceof File) {
            metaFiles.push({
              name: files[i].name,
              size: files[i].size,
              type: files[i].type,
            });
            obj[key + "[" + i + "]"] = files[i];
          }
        }

        obj[key] = metaFiles.length > 0 ? JSON.stringify(metaFiles) : value;
        return obj
      }

      obj[key] = value;
      return obj;*/
    }, {});

    /*const errors = Object.values(this.formFields).filter(e => e.data.hidden !== 1).reduce((errors, field) => {
      if (field.element === FORM_TABLE) {
        const tableErrors = field?.validate();
        return [...errors, ...tableErrors];
      } else {
        return [...errors, field?.validate()];
      }
    }, []).flat().filter(e => !e?.valid).map(e => e?.message);

    if (errors.length > 0) {
      loopar.throw({
        type: 'error',
        title: 'Validation error',
        message: errors.join('<br/>')
      });
    }*/

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
    return this.formFields.defaultValues[name] || null;
    /*const field = this.getField(name);
    return field ? field.value() : null;*/
  }

  get formValues() {
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

      if([FORM_TABLE].includes(field.def.element)) {
        obj[name] = JSON.stringify(value.rows);
        return obj;
      }

      obj[name] = value;
      return obj;
    }, {});
  }

  #formData() {
    const [data, formData] = [this.formValues, new FormData()];

    for (const key in data) {
      if (data.hasOwnProperty(key)) {
        const value = data[key]// (typeof data[key] === 'object' && !(data[key] instanceof File)) ? JSON.stringify(data[key]) : data[key];
        formData.append(key, value);
      }
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