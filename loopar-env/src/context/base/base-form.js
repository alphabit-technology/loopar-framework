/*import { loopar } from '/loopar.js';
import BaseDocument from "./base-document.js";
import { http } from '/router/http.js';*/

/*export default class BaseForm extends BaseDocument {
   tagName = "form";
   formFields = {};
   hasSidebar = true;
   lastData = null;

   constructor(props) {
      super(props);
   }

   save() {
      this.send({ action: this.props.meta.action });
   }

   hydrate() {
      loopar.rootApp.updateDocument(this.props.meta.key, this.formValues, false);
   }

   componentDidMount(prevProps, prevState) {
      super.componentDidMount(prevProps, prevState);
      this.lastData = JSON.stringify(this.formValues);
   }

   send(options = { action: this.props.meta.action }) {
      options = typeof options === 'string' ? { action: options } : options;
      this.hydrate();
      this.validate();

      /*console.log({
         isNew: this.props.meta.__IS_NEW__,
         lastData: JSON.parse(this.lastData),
         formValues: this.formValues,
         test: (!this.props.meta.__IS_NEW__ && (!this.lastData || (this.lastData && this.lastData === JSON.stringify(this.formValues))))
      });

      if (!this.notRequireChanges && !this.props.meta.__IS_NEW__ && (!this.lastData || (this.lastData && this.lastData === JSON.stringify(this.formValues)))) {
         this.lastData = JSON.stringify(this.formValues);
         loopar.notify("No changes to save", "warning");
         return;
      }


      //this.#formData();

      return new Promise((resolve, reject) => {
         http.send({
            action: options.action,
            params: this.params,
            body: this.#formData(),
            success: r => {
               if (r && r.success) {
                  this.lastData = JSON.stringify(this.formValues);
                  if (loopar.rootApp && loopar.rootApp.refresh) {
                     loopar.rootApp.refresh().then(() => {
                        loopar.notify(r.message);
                     });
                  } else {
                     window.location.reload();
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
      const errors = Object.values(this.formFields).filter(e => e.data.hidden !== 1).reduce((errors, field) => {
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
      }
   }

   getField(name) {
      return this.formFields[name] || null;
   }

   getValue(name) {
      const field = this.getField(name);
      return field ? field.val() : null;
   }

   get formValues() {
      return Object.entries(this.formFields).reduce((obj, [key, input]) => {
         if (input.groupElement === FILE_INPUT) {
            const files = input.files;
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

            obj[key] = metaFiles.length > 0 ? JSON.stringify(metaFiles) : input.val();
            return obj
         }

         obj[key] = input.val();
         return obj;
      }, {});
   }

   #formData() {
      const [data, formData] = [this.formValues, new FormData()];

      for (const key in data) {
         if (data.hasOwnProperty(key)) {
            const value = (typeof data[key] === 'object' && !(data[key] instanceof File)) ? JSON.stringify(data[key]) : data[key];
            formData.append(key, value);
         }
      }

      return formData;
   }

   setValue(name, value) {
      /*const field = this.getField(name);
      field && field.val(value);
   }
}*/