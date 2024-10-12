'use strict'
import { dataInterface } from '../global/element-definition.js';
import { loopar } from '../loopar.js';
import { marked } from "marked";

export default class DynamicField {
  #value = null;

  constructor(props, value) {
    this.#make(props, value);
    this.value = value;
  }

  #make(props) {
    const data = Object.assign({}, props.data || {});
    delete props.data;

    Object.assign(this, data, props);
  }

  set value(value) {
    this.#value = loopar.utils.nullValue(value) ? this.default_value : value;
  }

  get isParsed() {
    return this.element === 'text_editor' || ['__ENTITY__', 'doc_structure', 'form_structure'].includes(this.name);
  }

  get value() {
    const value = this.isParsed ? this.#parse() : this.#value;

    if ([CHECKBOX, SWITCH].includes(this.element)) {
      return loopar.utils.trueValue(value) ? 1 : 0;
    }

    /*if (this.element === SELECT && loopar.utils.isJSON(value)) {
      return JSON.parse(value)?.option || ""
    }*/

    /*if(this.element === DESIGNER){
      let els = value//loopar.utils.isJSON(value) ? JSON.parse(value) : [];

      if(els && els.length > 0  && els[0].element !== 'fragment'){
        els = [
          {
            element: 'fragment',
            data: {key: "designer-root", name: "designer-root", id: "designer-root", label: "Designer Root"},
            elements: els
          }
        ]
      }

      return els;
    }*/


    /*if (this.element === MARKDOWN) {
      return marked(value);
    }*/

    return value == null || typeof value == "undefined" ? "" : value;
  }

  get stringifyValue() {
    const value = this.#value;
    if ([DATE, TIME, DATE_TIME].includes(this.element)) {
      const fn = this.element === DATE ? 'getDate' : this.element === DATE_TIME ? 'getDateTime' : 'getTime';
      return loopar.dateUtils[fn](value, 'DB');
    }

    if (this.element === FORM_TABLE) {
      return loopar.utils.isJSON(value) ? JSON.parse(value) : value;
    }

    if (this.element === SELECT && loopar.utils.isJSON(value)) {
      return JSON.parse(value)?.option || ""
    }

    if ([CHECKBOX, SWITCH].includes(this.element)) {
      return loopar.utils.trueValue(value) ? 1 : 0;
    }

    /*if(this.element === FILE){
       console.log('FILE:', value, typeof value);
       if(!value && typeof value == "object"){
         
          return value.name
       }
    }*/

    //if (this.name === 'doc_structure') console.log(JSON.stringify(value, null, 3))

    return typeof value == 'object' ? JSON.stringify(value) : value;
  }

  #parse() {
    return loopar.utils.isJSON(this.#value) ? JSON.parse(this.#value) : this.#value;
  }

  get formattedValue() {
    return this.#value;
  }

  validate() {
    return dataInterface(this, this.#value).validate();
  }
}
