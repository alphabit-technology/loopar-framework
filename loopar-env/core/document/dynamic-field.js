'use strict'
import { dataInterface } from '../global/element-definition.js';
import { trueValue } from "../../public/tools/helper.js";

export default class DynamicField {
   #value = null;

   constructor(props, value) {
      this.#make(props, value);
      this.value = value;
   }

   #make(props) {
      const data = props.data || {};
      delete props.data;

      Object.assign(this, data, props,);
   }

   set value(value) {
      this.#value = value;
   }

   get isParsed() {
      return this.element === 'text_editor' || ['__DOCTYPE__', 'doc_structure', 'form_structure'].includes(this.name);
   }

   get value() {
      const value = this.isParsed ? this.#parse() : this.#value;

      if ([CHECKBOX, SWITCH].includes(this.element)) {
         return trueValue(value) ? 1 : 0;
      }

      return value == null || typeof value == "undefined" ? "" : value;
   }

   get stringifyValue() {
      const value = this.#value;
      if ([DATE, TIME, DATE_TIME].includes(this.element)) {
         if (value == null || typeof value == "undefined" || value === "" || value === "Invalid Date")
            return null;

         return dayjs(value).format(this.format);
      }

      if (this.element === FORM_TABLE) {
         return this.ifJson(value) ? JSON.parse(value) : "{}";
      }

      /*if(this.element === FILE){
         console.log('FILE:', value, typeof value);
         if(!value && typeof value == "object"){
           
            return value.name
         }
      }*/

      return typeof value == 'object' ? JSON.stringify(value) : value;
   }

   #parse() {
      return this.ifJson() ? JSON.parse(this.#value) : this.#value;
   }

   get formattedValue() {
      return this.#value;
   }

   validate() {
      return dataInterface(this).validate();
   }

   ifJson() {
      try {
         JSON.parse(this.#value);
         return true;
      } catch (error) {
         return false;
      }
   }
}
