'use strict'

export default class Validator {
   #value = null;

   constructor(props, value) {
      this.#make(props, value);
      this.value = value;
   }

   #make(props) {
      const data = props.data;
      delete props.data;

      Object.assign(this, data, props);
   }

   set value(value) {
      this.#value = value;
   }

   get value() {
      return this.#value || null;
   }
}
