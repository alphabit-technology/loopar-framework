//import { decamelize } from '/tools/decamelize.js';
const _text = (text) => {
   return text || "Undefined"
}

const handlePreserveConsecutiveUppercase = (decamelized, separator) => {
   // Lowercase all single uppercase characters. As we
   // want to preserve uppercase sequences, we cannot
   // simply lowercase the separated string at the end.
   // `data_For_USACounties` → `data_for_USACounties`
   decamelized = decamelized.replace(
      /((?<![\p{Uppercase_Letter}\d])[\p{Uppercase_Letter}\d](?![\p{Uppercase_Letter}\d]))/gu,
      $0 => $0.toLowerCase(),
   );

   // Remaining uppercase sequences will be separated from lowercase sequences.
   // `data_For_USACounties` → `data_for_USA_counties`
   return decamelized.replace(
      /(\p{Uppercase_Letter}+)(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
      (_, $1, $2) => $1 + separator + $2.toLowerCase(),
   );
};

function decamelize(text, { separator = '-', preserveConsecutiveUppercase = false } = {}) {
   text = _text(text).replaceAll(/\s/g, '');
   if (!(typeof text === 'string' && typeof separator === 'string')) {
      throw new TypeError(
         'The `text` and `separator` arguments should be of type `string`',
      );
   }

   // Checking the second character is done later on. Therefore process shorter strings here.
   if (text.length < 2) {
      return preserveConsecutiveUppercase ? text : text.toLowerCase();
   }

   const replacement = `$1${separator}$2`;

   // Split lowercase sequences followed by uppercase character.
   // `dataForUSACounties` → `data_For_USACounties`
   // `myURLstring → `my_URLstring`
   const decamelized = text.replace(
      /([\p{Lowercase_Letter}\d])(\p{Uppercase_Letter})/gu,
      replacement,
   );

   if (preserveConsecutiveUppercase) {
      return handlePreserveConsecutiveUppercase(decamelized, separator);
   }

   // Split multiple uppercase characters followed by one or more lowercase characters.
   // `my_URLstring` → `my_ur_lstring`
   return decamelized
      .replace(
         /(\p{Uppercase_Letter})(\p{Uppercase_Letter}\p{Lowercase_Letter}+)/gu,
         replacement,
      )
      .toLowerCase();
}

/**
 *
 * @param {*} text as string
 * @returns
 */
function Capitalize(text) {
   return _text(text).charAt(0).toUpperCase() + _text(text).slice(1);
}

/**
 *
 * @param {*} text as string
 * @returns
 */
function UPPERCASE(text) {
   return _text(text).toUpperCase();
}

/**
 *
 * @param {*} text as string
 * @returns
 */
function lowercase(text) {
   return _text(text).toLowerCase();
}

/**
 *
 * @param {*} name
 * @returns
 */
function debug_name(name) {
   return _text(name).replace(/\s|-/g, "_");
}

/**
 *
 * @param {*} text
 * @returns
 */

function hash(text) {
   var self = text, range = Array(text.length);
   for (var i = 0; i < self.length; i++) {
      range[i] = i;
   }
   return 'has' + Array.prototype.map.call(range, function (i) {
      return self.charCodeAt(i).toString(16);
   }).join('');
}

/**
 *
 * @param {*} value
 * @returns
 */
function trueValue(value) {
   return [true, "true", 1, "1"].includes(value);
}

function humanize(string) {
   if (typeof string !== 'string') {
      throw new TypeError('Expected a string');
   }

   string = decamelize(string);
   string = string.toLowerCase().replace(/[_-]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
   string = string.charAt(0).toUpperCase() + string.slice(1);

   return string;
}

function fixJSON(json) {
   json = json.replace(`""""`, `""`).replace('&#34;&#34;&#34;&#34', ';&#34;&#34;');
   if (json.includes('""""') || json.includes('&#34;&#34;&#34;&#34')) {
      json = fixJSON(json);
   }

   return json;
}

function JSONstringify(obj) {
   return Flatted.stringify(obj);
}

function JSONparse(obj) {
   const text = fixJSON(obj);

   return typeof obj == "object" ? obj : JSON.parse(fixJSON(obj));
}

function random_string(length) {
   var result = '';
   const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

   const charactersLength = characters.length;
   for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
   }
   return 'N' + result;
}

export {
   Capitalize,
   UPPERCASE,
   lowercase,
   debug_name,
   hash,
   trueValue,
   humanize,
   JSONstringify,
   JSONparse,
   decamelize,
   random_string
}