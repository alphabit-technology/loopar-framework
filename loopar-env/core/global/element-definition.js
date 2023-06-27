'use-strict';

const common_props = ['draggable', 'draggable_actions'];
const droppable_props = ['droppable', 'droppable_actions'];

const varchar_len = '(255)';
const [text,long_text,varchar,decimal,int,mediumint,longint,date,date_time,time] =
   ['text', 'longtext', 'varchar', 'decimal', 'int', 'mediumint', 'longint', 'date', 'datetime', 'time'];

const [LAYOUT_ELEMENT, DESIGN_ELEMENT, FORM_ELEMENT] = ['layout', 'design', 'form'];

export const elements_definition = {
   [LAYOUT_ELEMENT]: [
      {element: "section", icon: "fa fa-th-large"},
      {element: "div", icon: "fa fa-code"},
      {element: "row", icon: "fa fa-plus"},
      {element: "col", icon: "fas fa-columns"},
      {element: "card", icon: "fa fa-id-card"},
      {element: "panel", icon: "fa fa-window-maximize"},
      //{element: "table", icon: "fa fa-table"},
      {element: "banner", icon: "fa fa-image"},
      {element: "banner_image", icon: "fa fa-image"},
      {element: "tabs", icon: "fa fa-window-maximize"}
   ],
   [DESIGN_ELEMENT]: [
      {element: "image", icon: "fa fa-image"},
      {element: "text_block", icon: "fa fa-font"},
      {element: "text_block_icon", icon: "fa fa-font"},
      {element: "button", icon: "fa fa-hand-pointer"},
      //{element: "icon", icon: "fa fa-hand-pointer"},
      {element: "markdown", icon: "fa fa-text-height"},
      {element: "title", icon: "fa fa-heading"},
      //{element: "subtitle", icon: "fa fa-heading"},
      //{element: "link", icon: "fa fa-link"},
      //{element: "list", icon: "fa fa-list"},
      {element: "stripe", icon: "fab fa-stripe"},
      {element: "gallery", icon: "fa fa-images"},
   ],
   [FORM_ELEMENT]: [
      {element: "input", icon: "fa fa-italic", type: [varchar, varchar_len]},
      {element: "password", icon: "fa fa-key", type: [varchar, varchar_len]},
      {element: "date", icon: "fa fa-calendar-plus", type: [date, ''], format: 'YYYY-MM-DD'},
      {element: "date_time", icon: "fa fa-calendar-plus", type: [date_time, ''], format: 'YYYY-MM-DD HH:mm:ss'},
      {element: "time", icon: "fa fa-calendar-plus", type: [time, '6'], format: 'HH:mm:ss'},
      {element: "currency", icon: "fa fa-dollar-sign", type: [decimal, '(18,6)'], show_in_design: false},
      {element: "integer", icon: "fa-duotone fa-input-numeric", type: [int, '(11)'], show_in_design: false},
      {element: "decimal", icon: "fa fa-00", type: [decimal, '(18,6)'], show_in_design: false},
      {element: "select", icon: "fa fa-search-plus", type: [varchar, varchar_len]},
      {element: "textarea", icon: "fa fa-text-height", type: [long_text, '']},
      {element: "text_editor", icon: "fa fa-text-height", type: [long_text, '']},
      {element: "checkbox", icon: "fa fa-check-square", type: [int, '(11)']},
      {element: "switch", icon: "fa fa-toggle-on", type: [int, '(11)']},
      {element: "id", icon: "fa fa-id-card", type: [int], show_in_design: false},
      {element: "form_table", icon: "fa fa-table", type: [varchar, varchar_len]},
      {element: "markdown_input", icon: "fa fa-text-height", type: [long_text, '']},
      {element: "designer", icon: "fa fa-id-card", type: [long_text, '']},
      {element: "file_input", icon: "fa fa-file", type: [long_text, '']},
      {element: "file_uploader", icon: "fa fa-upload", type: [long_text, '']},
      {element: "image_input", icon: "fa fa-image", type: [long_text, '']},
      {element: "color_picker", icon: "fa fa-palette", type: [varchar, varchar_len] }
   ]
}

export const elements_dict = Object.freeze(Object.entries(elements_definition).reduce((acc, [key, value]) => {
   value.forEach(element => {
      const props = {props: (element.props || []).concat(common_props)};
      acc[element.element] = {...element, ...props, ...{group: key, is_writable: key === FORM_ELEMENT}};
   });

   return acc;
}, {}));

export const elements_names = Object.freeze(Object.values(elements_definition).reduce((acc, current) => {
   acc = [...acc, ...current.map(element => {
      if (!global[element.element.toUpperCase()]) {
         Object.defineProperty(global, element.element.toUpperCase(), {
            get: () => element.element,
            set: () => {
               throw (element.element + ' is a Safe CONST and cannot be re-declared.')
            }
         });
      }

      return element.element;
   })];

   return acc;
}, []));

class DataInterface {
   #element = null;

   constructor(element) {
      this.#element = element;
      //this.data = Object.assign({}, (element.data || {}), element);
   }

   get data() {
      return this.#element.data || this.#element;
   }

   debug_text(text) {
      return text.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g, '');
   }

   /*function to replace underscore with space*/
   replace_underscore(text) {
      return text.replace(/_/g, ' ');
   }

   /*function to replace space with underscore*/
   replace_space(text) {
      return text.replace(/ /g, '_');
   }

   /**function to convert  */

   get value() {
      return (this.#element.val && typeof this.#element.val === 'function') ? this.#element.val() : this.data.value;
      //return this.data.value// this.#element.val ? this.#element.val() : this.#element.value;
   }

   validator_rules() {
      var type = this.#element.element === INPUT ? this.data.format || this.#element.element : this.#element.element;

      type = type.charAt(0).toUpperCase() + type.slice(1);

      if (this['is' + type]) {
         return this['is' + type]();
      }

      return {
         valid: true
      };
   }

   isCurrency() {
      var regex = /^[1-9]\d*(?:\.\d{0,2})?$/;
      return {
         valid: regex.test(this.value),
         message: 'Invalid Currency'
      }
   }

   isEmail() {
      var regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
      return {
         valid: regex.test(this.value),
         message: 'Invalid email address'
      }
   }

   isUrl() {
      var regex = /^(?:(?:https?|ftp):\/\/)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/\S*)?$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid URL'
      }
   }

   isPassword() {
      var regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      return {
         valid: true,// regex.test(this.value),
         message: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number and one special character'
      }
   }

   isDate() {
      return {
         valid: dayjs(this.value).isValid(),
         message: 'Please enter a valid date'
      }
   }

   isTime() {
      return this.isDate();
   }

   isDateTime() {
      return this.isDate();
   }

   isPhone() {
      var regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid phone number'
      }
   }

   isPostalCode() {
      var regex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid postal code'
      }
   }

   isNumber() {
      var regex = /^[0-9]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   isIn() {
      var regex = /^[0-9]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   isFloat() {
      var regex = /^[0-9]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   isAlpha() {
      var regex = /^[a-zA-Z]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   isAlphaNumeric() {
      var regex = /^[a-zA-Z0-9]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   isAlphaDash() {
      var regex = /^[a-zA-Z0-9_\-]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   isAlphaDashSpace() {
      var regex = /^[a-zA-Z0-9_\-\s]+$/;
      return {
         valid: regex.test(this.value),
         message: 'Please enter a valid number'
      }
   }

   validator_required() {

      const required = [true, 'true', 1, '1'].includes(this.data.required);

      return {
         valid: !required || !(typeof this.value == "undefined" || (["null", "undefined"].includes(this.value) || (this.value || "").toString().length === 0)),
         message: `${this.__label()} is required`
      }
   }

   validate() {
      const validator_required = this.validator_required();

      if (!validator_required.valid) {
         return this.#validator_message(validator_required);
      }

      if (this.data.no_validate_type) {
         return {valid: true, message: ''};
      }

      const validator_rules = this.validator_rules();
      validator_rules.message = (validator_rules.message || "") + " in " + this.__label();

      return this.#validator_message(validator_rules);
   }

   #validator_message(validator) {
      const message = `<strong><i class="fa fa-solid fa-angle-right mr-1" style="color: var(--red);"></i><strong>${validator.message}</strong>`

      return {
         valid: validator.valid,
         message: message
      }
   }

   __label() {
      return this.data.label;
   }
}

export const data_interface = (element) => {
   return new DataInterface(element);
}

global.ELEMENT_DEFINITION = function (element, or=null) {
   return (elements_dict[element] || elements_dict[or]) || new Error('Element ' + element + ' not found');
}

export const GlobalEnvironment = () => {
   //global.element_definition = element_definition;


   global.fieldIsWritable = (field) => {
      return elements_dict[field.element]?.is_writable;
   }
   global.VALIDATION_ERROR = {code: 400, title: 'Validation error'};
   global.NOT_FOUND_ERROR = {code: 404, title: 'Not found'};
   global.INTERNAL_SERVER_ERROR = {code: 500, title: 'Internal server error'};
   global.UNAUTHORIZED_ERROR = {code: 401, title: 'Unauthorized'};
   global.FORBIDDEN_ERROR = {code: 403, title: 'Forbidden'};
   global.BAD_REQUEST_ERROR = {code: 400, title: 'Bad request'};
   global.CONFLICT_ERROR = {code: 409, title: 'Conflict'};
   global.NOT_ACCEPTABLE_ERROR = {code: 406, title: 'Not acceptable'};
   global.UNPROCESSABLE_ENTITY_ERROR = {code: 422, title: 'Unprocessable entity'};
   global.SERVICE_UNAVAILABLE_ERROR = {code: 503, title: 'Service unavailable'};
   global.INTERNAL_SERVER_ERROR = {code: 500, title: 'Internal server error'};
   global.NOT_IMPLEMENTED_ERROR = {code: 501, title: 'Not implemented'};
   global.GATEWAY_TIMEOUT_ERROR = {code: 504, title: 'Gateway timeout'};
   global.UNSUPPORTED_MEDIA_TYPE_ERROR = {code: 415, title: 'Unsupported media type'};
   global.LENGTH_REQUIRED_ERROR = {code: 411, title: 'Length required'};
   global.REQUEST_ENTITY_TOO_LARGE_ERROR = {code: 413, title: 'Request entity too large'};
   global.REQUEST_URI_TOO_LONG_ERROR = {code: 414, title: 'Request URI too long'};
}