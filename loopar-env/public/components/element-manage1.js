import { loopar } from "/loopar.js";

/**Need to global tags*/
//import {elementsNames} from "/element-definition.js";
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

   elementName(element) {
      let counter = loopar['element' + element];
      counter = !counter || isNaN(counter) ? 1 : counter + 1;
      loopar['element' + element] = counter;

      const base_name = `${element}${counter}`;
      const id = base_name + "_" + this.uuid();

      return {
         id: id,
         name: id,
         label: loopar.utils.Capitalize(base_name)
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

   fixElements(elements) {
      return elements.map(el => {
         el.data ??= {};

         if (!el.data.name || !el.data.id || !el.data.label || !el.data.key) {
            const names = elementManage.elementName(el.element);
            //el.data.name ??= names.name;
            el.data.key ??= elementManage.getUniqueKey();
            //el.data.id ??= names.id;
            el.data.label ??= loopar.utils.Capitalize(names.label.replaceAll('_', ' '));
         }

         if (el.elements) {
            el.elements = this.fixElements(el.elements);
         }
         return el;
      });
   }
}

export const elementManage = new ElementManage();

export function styleToObject(style) {
   if (typeof style != "string") return style;

   return style.replaceAll(" ", "").split(';').reduce((acc, cur) => {
      const [key, value] = cur.split(':');
      acc[key] = value;
      return acc;
   }, {})
}