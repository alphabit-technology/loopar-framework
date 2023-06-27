import {loopar} from "/loopar.js";
import {Capitalize} from '/tools/helper.js';

/**Need to global tags*/
//import {elements_names} from "/element-definition.js";
/**Need to global tags*/

export default class ElementManage {
   constructor() { }

   initialize() {
      return new Promise(resolve => {
         document.ready(() => {
            resolve();
         });
      });
   }

   element_name(element) {
      let counter = loopar['element' + element];
      counter = !counter || isNaN(counter) ? 1 : counter + 1;
      loopar['element' + element] = counter;

      const base_name = `${element}${counter}`;
      const id = base_name + "_" + this.uuid();

      return {
         id: id,
         name: id,
         label: Capitalize(base_name)
      };
   }

   uuid() {
      return "el" + Math.floor(Math.random() * Math.floor(Math.random() * Date.now()));
   }

   getUniqueKey() {
      return Math.random().toString(36).substr(2, 9);
   }

   isJSON(str) {
      try {
         JSON.parse(str);
      } catch (e) {
         return false;
      }
      return true;
   }
}

export const element_manage = new ElementManage();

export function styleToObject(style){
   if(typeof style != "string") return style;

   return style.replaceAll(" ", "").split(';').reduce((acc, cur) => {
      const [key, value] = cur.split(':');
      acc[key] = value;
      return acc;
   }, {})
}