'use strict'

export default class ObjectManage {
   constructor(props) {
      Object.assign(this, props);
   }

   is_obj(obj) {
      return typeof obj === "object" && obj != null && !["undefined", "string"].includes(typeof obj);
   }

   in_object(obj, f) {
      if (this.is_obj(obj)) {
         Object.keys(obj).forEach((key) => {
            f(obj[key], key);
         });
      }
   }
}