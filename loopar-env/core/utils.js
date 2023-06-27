'use strict';

export default class Utils {
   constructor() {
   }

   capitalize(word = null) {
      return word ? word[0].toUpperCase() + word.slice(1) : null;
   }

   UPPERCASE(word) {
      return word ? word.toUpperCase() : null;
   }

   lowerCase(word) {
      return word ? word.toLowerCase() : null;
   }

   avatar_letter(word) {
      let value = "";

      if (word) {
         word.split(" ").forEach(word => {
            value += word[0].toUpperCase();
         });
      }

      return value;
   }
}

const utils = new Utils();