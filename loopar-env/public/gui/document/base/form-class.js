import { object_manage } from "/tools/object-manage.js";
import { http } from '/router/http.js';
import { loopar } from '/loopar.js';
export class FormClass {
   document_is_set = false;

   constructor(props) { }

   $save() {
      this.send({ action: this.data.action });
   }

   send(options = { action: this.action }) {
      http.send({
         action: options.action,
         params: this.params,
         body: this._form_values,
         success: r => {
            if (r && r.content && r.content.success) {
               loopar.root_app.refresh().then(() => {
                  loopar.navigate("update?documentName=" + r.content.documentName);
               });
               loopar.notify(r.content.message);
            }

            this.content = r.content;
            options.success && options.success(r);
         },
         error: r => {
            options.error && options.error(r);
         }
      });
   }

   $load_document() {
      const state = this.props.meta;
      if (!this.document_is_set) this.document = clone(state.meta.data.__DOCUMENT__);
   }

   onUpdate() {
      this.load_document ? this.load_document() : this.$load_document();
   }

   set document(data) {
      this.document_is_set = true;
      Object.entries(data).forEach(([field_name, value]) => {
         const field = this.get_field(field_name);

         if (field) {
            field.is_writable && field.val(value);

            if (field.element === MARKDOWN_INPUT) {
               field.setState({ data: { editing_mode: true } });
            }
         }
      });
   }

   get params() {
      return {
         documentName: this.data.__documentName__,
      }
   }

   get document() {
      return Object.entries(this.form_fields).reduce((obj, [key, value]) => {
         obj[key] = value.val();
         return obj;
      }, {});
   }

   get is_designer() {
      return !!this.designer_container;
   }

   get designer_container() {
      return this.doc_designer;
   }

   validate() {
      const errors = [];

      const _validate = (fields) => {
         object_manage.in_object(fields, field => {
            if (object_manage.is_obj(field)) {
               if (field.typeof === "JSHtml") {
                  const valid = field.validate();

                  if (!valid.valid) {
                     errors.push(valid.message);
                  }
               } else {
                  _validate(field);
               }
            }
         });
      }

      _validate(this.container.fields);

      /*if (errors.length > 0) {
         modal_dialog({
            title: 'Validation error',
            message: errors.join('<br/>')
         });

         throw errors.join('<br>');
      }*/
   }

   get_field(name) {
      return this.form_fields[name] || null;
   }

   get _form_values() {
      return this.form_values || this.$form_values;
   }

   get $form_values() {
      return Object.entries(this.form_fields).reduce((obj, [key, value]) => {
         obj[key] = value.val();
         return obj;
      }, {});
   }

   set_value(name, value) {
      const field = this.get_field(name);
      field && field.val(value);
   }
}