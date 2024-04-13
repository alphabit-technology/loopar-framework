'use-strict';
import dayjs from 'dayjs';
import {getTime} from './date-utils.js';

const commonProps = ['draggable', 'draggable_actions'];
const droppableProps = ['droppable', 'droppable_actions'];

const varcharLen = '(255)';
const [text, long_text, varchar, decimal, int, mediumint, longint, date, date_time, time] =
  ['text', 'longtext', 'varchar', 'decimal', 'int', 'mediumint', 'longint', 'date', 'datetime', 'time'];

const [LAYOUT_ELEMENT, DESIGN_ELEMENT, FORM_ELEMENT, HTML] = ['layout', 'design', 'form', 'html'];

export const elementsDefinition = {
  [LAYOUT_ELEMENT]: [
    { element: "section", icon: "GalleryVertical" },
    { element: "div", icon: "Code" },
    { element: "row", icon: "Grid" },
    { element: "col", icon: "Columns" },
    { element: "card", icon: "PanelTop" },
    { element: "panel", icon: "InspectionPanel" },
    //{element: "table", icon: "fa fa-table"},
    { element: "banner", icon: "GalleryHorizontalEnd" },
    { element: "banner_image", icon: "ImagePlus" },
    { element: "tabs", icon: "AppWindow" },
    { element: "tab", icon: "Table2" },
    { element: "generic", icon: "Code" },
  ],
  [DESIGN_ELEMENT]: [
    { element: "image", icon: "Image" },
    { element: "slider", icon: "GalleryHorizontalEnd" },
    { element: "carrusel", icon: "GalleryHorizontalEnd" },
    { element: "gallery", icon: "ImagePlus" },
    { element: "text_block", icon: "AlignJustify" },
    { element: "text_block_icon", icon: "Outdent" },
    { element: "button", icon: "MousePointer" },
    { element: "link", icon: "MousePointerClick" },
    //{element: "icon", icon: "fa fa-hand-pointer"},
    { element: "markdown", icon: "BookOpenCheck", clientOnly: true },
    { element: "title", icon: "Heading1" },
    { element: "subtitle", icon: "Heading2" },
    { element: "paragraph", icon: "Pilcrow" },
    //{element: "link", icon: "fa fa-link"},
    //{element: "list", icon: "fa fa-list"},
    { element: "stripe", icon: "CreditCard" },
    { element: "stripe_embebed", icon: "CreditCard" },
    //{ element: "element_title", icon: "fa fa-heading" },
  ],
  [FORM_ELEMENT]: [
    { element: "input", icon: "FormInput", type: [varchar, varcharLen] },
    { element: "password", icon: "Asterisk", type: [varchar, varcharLen] },
    { element: "date", icon: "Calendar", type: [date, ''], format: 'YYYY-MM-DD' },
    { element: "date_time", icon: "CalendarClock", type: [date_time, ''], format: 'YYYY-MM-DD HH:mm:ss' },
    { element: "time", icon: "Clock10", type: [time, ''], format: 'HH:mm:ss' },
    { element: "currency", icon: "Currency", type: [decimal, '(18,6)'], show_in_design: false },
    { element: "integer", icon: "fa-duotone fa-input-numeric", type: [int, '(11)'], show_in_design: false },
    { element: "decimal", icon: "fa fa-00", type: [decimal, '(18,6)'], show_in_design: false },
    { element: "select", icon: "ChevronDown", type: [varchar, varcharLen] },
    { element: "textarea", icon: "FileText", type: [long_text, ''] },
    { element: "tailwind", icon: "PaintRoler", type: [long_text, ''] },
    { element: "text_editor", icon: "TextCursorInput", type: [long_text, ''] },
    { element: "checkbox", icon: "CheckSquare", type: [int, '(11)'] },
    { element: "switch", icon: "ToggleLeft", type: [int, '(11)'] },
    { element: "id", icon: "BookKey", type: [int] },
    { element: "form_table", icon: "Sheet", type: [varchar, varcharLen] },
    { element: "markdown_input", icon: "BookOpenCheck", type: [long_text, ''], clientOnly: true },
    { element: "designer", icon: "Brush", type: [long_text, ''] },
    { element: "file_input", icon: "FileInput", type: [long_text, ''] },
    { element: "file_uploader", icon: "FileUp", type: [long_text, ''] },
    { element: "image_input", icon: "FileImage", type: [long_text, ''] },
    { element: "color_picker", icon: "Palette", type: [varchar, varcharLen] }
  ]
}

export const elementsDict = Object.freeze(Object.entries(elementsDefinition).reduce((acc, [key, value]) => {
  value.forEach(element => {
    //const props = { props: (element.props || []).concat(commonProps) };
    acc[element.element] = { def: { ...element, ...{ group: key, isWritable: key === FORM_ELEMENT } } };
  });

  return acc;
}, {}));

export const elementsNames = Object.freeze(Object.values(elementsDefinition).reduce((acc, current) => {
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

export const elementsNameByType = (type) => {
  return elementsNames.filter(element => elementsDict[element].def.type.includes(type));
}

class DataInterface {
  #element = null;

  constructor(element, value) {
    this.#element = element;
    this.value = value;
    //this.#element.value ??= value;
    //this.#element.element ??= this.#element.def?.element;
    //this.data = Object.assign({}, (element.data || {}), element);
  }

  get data() {
    return this.#element.data || this.#element;
  }

  debugText(text) {
    return text.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g, '');
  }

  /*function to replace underscore with space*/
  replaceUnderscore(text) {
    return text.replace(/_/g, ' ');
  }

  /*function to replace space with underscore*/
  replaceSpace(text) {
    return text.replace(/ /g, '_');
  }

  get element() {
    const def = this.#element.props?.def || this.#element.def || this.#element || {};
    return def.element;
  }

  /**function to convert  */

  validatorRules() {
    var type = (this.element === INPUT ? this.data.format || this.element : this.element) || 'text';
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
      valid: dayjs(new Date(this.value)).isValid(),
      message: 'Please enter a valid date'
    }
  }

  isTime() {
    return {
      valid: dayjs(new Date(getTime(this.value))).isValid(),
      message: 'Please enter a valid date'
    }
  }

  isDateTime() {
    return this.isDate();
  }

  isPhone() {
    var regex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
    return {
      valid: regex.test(this.value),
      message:  'Please enter a valid phone number'
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

  validatorRequired() {
    const required = [true, 'true', 1, '1'].includes(this.data.required);
    return {
      valid: !required || !(typeof this.value == "undefined" || (["null", "undefined"].includes(this.value) || (this.value || "").toString().length === 0)),
      message: `${this.__label()} is required`
    }
  }

  validate() {
    const validatorRequired = this.validatorRequired();

    if (!validatorRequired.valid) {
      return this.#validatorMessage(validatorRequired);
    }

    if (this.data.no_validate_type) {
      return { valid: true, message: '' };
    }

    const validatorRules = this.validatorRules();
    validatorRules.message = `'${this.value}' is not a valid value in ${this.__label()}`;

    return this.#validatorMessage(validatorRules);
  }

  #validatorMessage(validator) {
    return {
      valid: validator.valid,
      message: validator.message
    }
  }

  __label() {
    return this.data.label;
  }
}

export const dataInterface = (element, value) => {
  return new DataInterface(element, value);
}

global.ELEMENT_DEFINITION = function (element, or = null) {
  return (elementsDict[element] || elementsDict[or])?.def || new Error('Element ' + element + ' not found');
}

global.fieldIsWritable = (field) => {
  return elementsDict[field.element]?.def?.isWritable;
}
export const GlobalEnvironment = () => {
  global.VALIDATION_ERROR = { code: 400, title: 'Validation error' };
  global.NOT_FOUND_ERROR = { code: 404, title: 'Not found' };
  global.INTERNAL_SERVER_ERROR = { code: 500, title: 'Internal server error' };
  global.UNAUTHORIZED_ERROR = { code: 401, title: 'Unauthorized' };
  global.FORBIDDEN_ERROR = { code: 403, title: 'Forbidden' };
  global.BAD_REQUEST_ERROR = { code: 400, title: 'Bad request' };
  global.CONFLICT_ERROR = { code: 409, title: 'Conflict' };
  global.NOT_ACCEPTABLE_ERROR = { code: 406, title: 'Not acceptable' };
  global.UNPROCESSABLE_ENTITY_ERROR = { code: 422, title: 'Unprocessable entity' };
  global.SERVICE_UNAVAILABLE_ERROR = { code: 503, title: 'Service unavailable' };
  global.INTERNAL_SERVER_ERROR = { code: 500, title: 'Internal server error' };
  global.NOT_IMPLEMENTED_ERROR = { code: 501, title: 'Not implemented' };
  global.GATEWAY_TIMEOUT_ERROR = { code: 504, title: 'Gateway timeout' };
  global.UNSUPPORTED_MEDIA_TYPE_ERROR = { code: 415, title: 'Unsupported media type' };
  global.LENGTH_REQUIRED_ERROR = { code: 411, title: 'Length required' };
  global.REQUEST_ENTITY_TOO_LARGE_ERROR = { code: 413, title: 'Request entity too large' };
  global.REQUEST_URI_TOO_LONG_ERROR = { code: 414, title: 'Request URI too long' };
}