'use strict';

import ObjectManage from "../ObjectManage.js";

export default class ListManage extends ObjectManage {
   constructor() {
      super();
   }

   field_build(fields_data) {
      let fields = [];
      fields_data.forEach(field => {
         if (field.data.in_list_view) {
            fields.push({name: field.data.name, label: field.data.label});
         }
         fields = fields.concat(this.field_build(field.elements));
      });

      return fields
   }

   data(data) {
      const base_data = data
      const fields_data = this.field_build(JSON.parse(base_data.doc_structure));
      const fields = [], labels = []

      fields_data.forEach(field => {
         fields.push(field.name);
         labels.push(field.label)
      });

      return {
         base_data: base_data,
         fields: fields.length === 0 ? ['*'] : fields,
         labels: labels
      }
   }
}