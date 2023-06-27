import {loopar} from '/loopar.js';
import BaseDocument from "./base-document.js";
import {http} from '/router/http.js';

export default class BaseForm extends BaseDocument {
   tag_name = "form";
   form_fields = {};
   has_sidebar = true;

   constructor(props) {
      super(props);
   }

   save() {
      this.send({action: this.props.meta.action});
   }

   hydrate(){
      loopar.root_app.updateDocument(this.props.meta.key, this.form_values, false);
   }

   send(options={action: this.props.meta.action}) {
      this.hydrate();
      this.validate();

      this.#formData();

      //return
      return new Promise((resolve, reject) => {
         http.send({
            action: options.action,
            params: this.params,
            body: this.#formData(),
            success: r => {
               if(r && r.success){
                  if(loopar.root_app){
                     loopar.root_app.refresh().then(() => {
                        loopar.notify(r.message);
                     });
                  }else{
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
         document_name: this.props.meta.__DOCUMENT_NAME__,
      }
   }

   validate() {
      const errors =Object.values(this.form_fields).filter(e => e.data.hidden !== 1).reduce((errors, field) => {
         if(field.element === FORM_TABLE) {
            const table_errors = field?.validate();
            return [...errors, ...table_errors];
         } else {
            return [...errors, field?.validate()];
         }
      }, []).flat().filter(e => !e?.valid).map(e => e?.message);

      if(errors.length > 0) {
         loopar.throw({
            type: 'error',
            title: 'Validation error',
            message: errors.join('<br/>')
         });
      }
   }

   get_field(name) {
      return this.form_fields[name] || null;
   }

   get form_values() {
      return Object.entries(this.form_fields).reduce((obj, [key, input]) => {
         if (input.group_element === FILE_INPUT){
            const files = input.files;
            const meta_files = [];

            for(let i = 0; i < files.length; i++){
               const file = files[i];
               if(file instanceof File){
                  meta_files.push({
                     name: files[i].name,
                     size: files[i].size,
                     type: files[i].type,
                  });
                  obj[key + "[" + i + "]"] = files[i];
               }
            }

            obj[key] = meta_files.length > 0 ? JSON.stringify(meta_files) : input.val();
            return obj
         }

         obj[key] = input.val();
         return obj;
      }, {});
   }

   #formData() {
      const [data, formData] = [this.form_values, new FormData()];

      for (const key in data) {
         if (data.hasOwnProperty(key)) {
            const value = (typeof data[key] === 'object' && !(data[key] instanceof File)) ? JSON.stringify(data[key]) : data[key];
            formData.append(key, value);
         }
      }

      return formData;
   }

   set_value(name, value) {
      /*const field = this.get_field(name);
      field && field.val(value);*/
   }
}