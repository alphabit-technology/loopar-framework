import dayjs from 'dayjs';
import {getTime} from './date-utils.js';

export const TYPES = Object.freeze({
  increments: 'increments',
  timestamps: 'timestamps',
  integer: 'INTEGER',
  bigInteger: 'BIGINT',
  smallint: 'SMALLINT',
  tinyint: 'TINYINT',
  float: 'FLOAT',
  decimal: 'DECIMAL',
  double: 'DOUBLE',

  string: 'VARCHAR',
  text: 'TEXT',
  mediumtext: 'MEDIUMTEXT',
  longtext: 'LONGTEXT',

  uuid: 'UUID',
  enum: 'ENUM',
  boolean: 'BOOLEAN',

  date: 'DATE',
  dateTime: 'DATETIME',
  time: 'TIME',
  timestamp: 'TIMESTAMP',

  binary: 'BLOB',
  json: 'JSON',
  jsonb: 'JSONB',

  geometry: 'GEOMETRY',
  point: 'POINT',
  multiPoint: 'MULTIPOINT',
});

export const COLUMN_FORMATS = {
  data: {
    description: "Short generic text. VARCHAR (length default 255).",
    inputType: "text",
    aliases: ["text", "read_only"],
    legacyTags: ["VARCHAR"],
    sql: (t, name, d) => t.string(name, d.length || 255),
  },
  email: {
    description: "Email address. VARCHAR.",
    inputType: "email",
    sql: (t, name, d) => t.string(name, d.length || 255),
  },
  password: {
    description: "Hashed password. VARCHAR (never store in plain text).",
    inputType: "password",
    sql: (t, name, d) => t.string(name, d.length || 255),
  },
  text: {
    description: "Long-form text. SQL TEXT (no key-length on UNIQUE).",
    inputType: "text",
    legacyTags: ["TEXT"],
    sql: (t, name) => t.text(name),
  },
  mediumtext: {
    description: "Medium-sized text (MySQL MEDIUMTEXT, TEXT elsewhere).",
    inputType: "text",
    legacyTags: ["MEDIUMTEXT"],
    sql: (t, name) => t.text(name, "mediumtext"),
  },
  longtext: {
    description: "Large text blob (MySQL LONGTEXT, TEXT elsewhere).",
    inputType: "text",
    legacyTags: ["LONGTEXT"],
    sql: (t, name) => t.text(name, "longtext"),
  },

  int: {
    description: "32-bit signed integer.",
    inputType: "number",
    aliases: ["integer"],
    legacyTags: ["INTEGER"],
    sql: (t, name) => t.integer(name),
  },
  long_int: {
    description: "64-bit signed integer.",
    inputType: "number",
    aliases: ["bigint"],
    legacyTags: ["BIGINT"],
    sql: (t, name) => t.bigInteger(name),
  },
  float: {
    description: "Single-precision float.",
    inputType: "number",
    legacyTags: ["FLOAT"],
    sql: (t, name) => t.float(name),
  },
  double: {
    description: "Double-precision float (DOUBLE / DOUBLE PRECISION).",
    inputType: "number",
    legacyTags: ["DOUBLE"],
    sql: (t, name) => t.double(name),
  },
  decimal: {
    description: "Fixed-precision decimal. precision/scale from data.",
    inputType: "number",
    aliases: ["percent"],
    legacyTags: ["DECIMAL"],
    sql: (t, name, d) => t.decimal(name, d.precision || 10, d.scale || 2),
  },
  currency: {
    description:
      "Money amount. Stored as DECIMAL — no native CURRENCY type exists " +
      "across MySQL/PG/SQLite, so we fall back to fixed-precision decimal.",
    inputType: "text",
    sql: (t, name, d) => t.decimal(name, d.precision || 18, d.scale || 4),
  },

  date: {
    description: "Calendar date (no time).",
    inputType: "date",
    legacyTags: ["DATE"],
    sql: (t, name) => t.date(name),
  },
  datetime: {
    description: "Date + time (TIMESTAMP / DATETIME depending on dialect).",
    inputType: "datetime-local",
    legacyTags: ["DATETIME", "TIMESTAMP"],
    sql: (t, name) => t.timestamp(name),
  },
  time: {
    description: "Time of day.",
    inputType: "time",
    legacyTags: ["TIME"],
    sql: (t, name) => t.time(name),
  },

  boolean: {
    description: "True/false (BOOLEAN — INTEGER on SQLite via Knex).",
    inputType: "checkbox",
    legacyTags: ["BOOLEAN"],
    sql: (t, name) => t.boolean(name),
  },
  json: {
    description: "JSON object. Maps to native JSON where supported.",
    inputType: "text",
    legacyTags: ["JSON"],
    sql: (t, name) => t.json(name),
  },
  jsonb: {
    description: "Binary JSON (PG-only; falls back to JSON elsewhere).",
    inputType: "text",
    legacyTags: ["JSONB"],
    sql: (t, name) => t.jsonb(name),
  },
  uuid: {
    description: "UUID. CHAR(36) on most dialects, native UUID on PG.",
    inputType: "text",
    legacyTags: ["UUID"],
    sql: (t, name) => t.uuid(name),
  },
  blob: {
    description: "Binary blob (BLOB / BYTEA).",
    inputType: "file",
    legacyTags: ["BLOB"],
    sql: (t, name) => t.binary(name),
  },
  increments: {
    description: "Auto-increment primary key (SERIAL / AUTO_INCREMENT).",
    inputType:   "number",
    legacyTags:  ["increments"],
    sql: (t, name) => t.increments(name),
  },
};

/**
 * Register a new column format at runtime (plugins / extensions).
 * Throws on collision — formats are append-only by design so a plugin
 * can't silently change DDL semantics for an existing key.
 */
export function registerColumnFormat(name, def) {
  if (!name || !def) throw new Error("registerColumnFormat: name and def required");
  if (COLUMN_FORMATS[name]) {
    throw new Error(`registerColumnFormat: format '${name}' already exists`);
  }
  if (typeof def.sql !== "function") {
    throw new Error(`registerColumnFormat('${name}'): def.sql must be a function`);
  }
  COLUMN_FORMATS[name] = def;
  rebuildDerivedMaps();
}

export const inputType = {};
export const COLUMN_FORMAT = {};
export const LEGACY_TAG_TO_FORMAT = new Map();

function rebuildDerivedMaps() {
  const it  = {};
  const cf  = {};
  LEGACY_TAG_TO_FORMAT.clear();

  for (const [key, def] of Object.entries(COLUMN_FORMATS)) {
    it[key] = def.inputType || "text";
    cf[key] = key;

    for (const tag of def.legacyTags || []) {
      LEGACY_TAG_TO_FORMAT.set(tag, key);
    }
  }

  for (const [key, def] of Object.entries(COLUMN_FORMATS)) {
    for (const alias of def.aliases || []) {
      const lower = alias.toLowerCase();
      it[lower] = def.inputType || "text";
      cf[lower] = key;
    }
  }

  Object.keys(inputType).forEach(k => delete inputType[k]);
  Object.assign(inputType, it);
  Object.keys(COLUMN_FORMAT).forEach(k => delete COLUMN_FORMAT[k]);
  Object.assign(COLUMN_FORMAT, cf);
}
rebuildDerivedMaps();

export function resolveColumnFormat(field) {
  if (!field?.data) return null;
  const declared = field.data.format ?? field.data.type;
  if (!declared) return null;
  return COLUMN_FORMAT[String(declared).toLowerCase()] || null;
}
export const ELEMENT_GROUPS = Object.freeze({
  LAYOUT_ELEMENT: 'layout',
  DESIGN_ELEMENT: 'design',
  FORM_ELEMENT: 'form',
  HTML_ELEMENT: 'html'
});

const { LAYOUT_ELEMENT, DESIGN_ELEMENT, FORM_ELEMENT, HTML_ELEMENT } = ELEMENT_GROUPS;

export const elementsDefinition = {
  [LAYOUT_ELEMENT]: [
    { element: "section", icon: "GalleryVertical" },
    { element: "div", icon: "Code" },
    { element: "row", icon: "Columns2" },
    { element: "col", icon: "Columns" },
    { element: "card", icon: "PanelTop" },
    { element: "feature_card", icon: "PanelBoottom" },
    { element: "banner", icon: "GalleryHorizontalEnd" },
    { element: "banner_image", icon: "ImagePlus" },
    { element: "tabs", icon: "AppWindow" },
    { element: "tab", icon: "Table2", show_in_design: false  },
    { element: "generic", icon: "Code" },
    { element: "menu_content", icon: "PanelRight" },
    { element: "fragment", icon: "Scan" },
    { element: "container", icon: "Dock" },
    { element: "panel", icon: "PanelBottom" },
    { element: "contact_form", icon: "Phone"},
    { element: "form", icon: "Form"},
  ],
  [DESIGN_ELEMENT]: [
    { element: "image", icon: "Image" },
    { element: "slider", icon: "SlidersHorizontal" },
    { element: "carousel", icon: "GalleryHorizontalEnd" },
    { element: "gallery", icon: "ImagePlus" },
    { element: "text_block", icon: "AlignJustify" },
    { element: "text_block_icon", icon: "Outdent" },
    { element: "button", icon: "MousePointer" },
    { element: "link", icon: "MousePointerClick" },
    { element: "icon", icon: "Boxes" },
    { element: "markdown", icon: "BookOpenCheck", designerOnly: true  },
    { element: "html_block", icon: "Code", type: TYPES.text, designerOnly: true, clientOnly: true },
    { element: "title", icon: "Heading1" },
    { element: "subtitle", icon: "Heading2" },
    { element: "paragraph", icon: "Pilcrow" },
    { element: "direct-preview", icon: "View" },
    { element: "direct-preview-iframe", icon: "View" },
    { element: "stripe", icon: "CreditCard" },
    { element: "stripe_embebed", icon: "CreditCard" },
    { element: "stripe_plans", icon: "LayoutGrid" },
    { element: "seo", icon: "Globe", designerOnly: true },
    { element: 'particles', icon: 'DotsHorizontal' },
    { element: 'particles_settings', icon: 'DotsHorizontal' },
    { element: 'example_viewer', icon: 'Scan' },
    { element: 'review', icon: "Pencil"},
    { element: 'collection', icon: "LayoutGrid"},
    { element: 'collection_view', icon: "LayoutGrid", show_in_design: false}
  ],
  [FORM_ELEMENT]: [
    { element: "input", icon: "FormInput", type: TYPES.string },
    { element: "password", icon: "Asterisk", type: TYPES.text },
    { element: "date", icon: "Calendar", type: TYPES.date, format: 'YYYY-MM-DD' },
    { element: "date_time", icon: "CalendarClock", type: TYPES.dateTime, format: 'YYYY-MM-DD HH:mm:ss' },
    { element: "time", icon: "Clock10", type: TYPES.time, format: 'HH:mm:ss' },
    { element: "currency", icon: "Currency", type: TYPES.decimal, show_in_design: false },
    { element: "integer", icon: "fa-duotone fa-input-numeric", type: TYPES.integer, show_in_design: false },
    { element: "decimal", icon: "fa fa-00", type: TYPES.decimal, show_in_design: false },
    { element: "select", icon: "ChevronDown", type: TYPES.text },
    { element: "padding", icon: "Shrink", type: TYPES.text },
    { element: "margin", icon: "Expand", type: TYPES.text },
    { element: "textarea", icon: "FileText", type: TYPES.longtext },
    { element: "tailwind", icon: "SiTailwindcss", type: TYPES.longtext },
    { element: "text_editor", icon: "TextCursorInput", type: TYPES.longtext, clientOnly: true },
    { element: "checkbox", icon: "CheckSquare", type: TYPES.integer },
    { element: "switch", icon: "ToggleLeft", type: TYPES.integer },
    { element: "id", icon: "BookKey", type: TYPES.increments, show_in_design: false },
    { element: "form_table", icon: "Sheet", type: TYPES.string },
    { element: "markdown_input", icon: "BookOpenCheck", type: TYPES.text, clientOnly: true },
    { element: "designer", icon: "Brush", type: TYPES.longtext },
    { element: "file_input", icon: "FileInput", type: TYPES.longtext },
    { element: "file_uploader", icon: "FileUp", type: TYPES.longtext },
    { element: "image_input", icon: "FileImage", type: TYPES.longtext },
    { element: "color_picker", icon: "Palette", type: TYPES.text },
    { element: "icon_input", icon: "Boxes", type: TYPES.text },
    { element: "radio_group", icon: "Circle", type: TYPES.text },
    { element: "radio_item", icon: "Circle", type: TYPES.integer, show_in_design: false },
    { element: "slot", icon: "Plug"},
    { element: "metadata", icon: "Code", type: TYPES.json}
  ]
}

export const elementsDict = Object.freeze(Object.entries(elementsDefinition).reduce((acc, [key, value]) => {
  value.forEach(element => {
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
  }

  get data() {
    return this.#element.data || this.#element;
  }

  debugText(text) {
    return text.replace(/_/g, ' ').replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).replace(/\s/g, '');
  }

  replaceUnderscore(text) {
    return text.replace(/_/g, ' ');
  }

  replaceSpace(text) {
    return text.replace(/ /g, '_');
  }

  get element() {
    const def = this.#element.props?.def || this.#element.def || this.#element || {};
    return def.element;
  }

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

export const AIPrompt = (prompt, document_type ) => {
  const exampleJSON = [
    {
      element: "row",
      elements: [
        {
          element: "col",
          elements: [
            {
              element: "input",
              data: {
                label: "Name",
                name: "name"
              }
            },
            {
              element: "input",
              data: {
                label: "Input 1",
                name: "input1"
              }
            }
          ]
        },
        {
          element: "col",
          elements: [
            {
              element: "input",
              data: {
                label: "Input 2",
                name: "input2"
              }
            },
            {
              element: "input",
              data: {
                label: "Input 3",
                name: "input3"
              }
            }
          ]
        }
      ],
    }
  ];

  const elements = elementsNames.filter(e => {
    if (document_type === "Entity") {
      return e !== SECTION
    } else {
      return true;
    }
  });

  return {
    system: {
      role: 'developer',
      content:
        `You are a strict JSON generator: example: ${JSON.stringify(exampleJSON)}. ALWAYS output valid JSON ONLY, nothing else (no commentary, no trailing commas, no explanation). If you cannot produce valid JSON, output {"error":"<short description>"} only.
        All elements MUST be objects with keys: "element" (string), data (object) {label, name, key}. If the element can have children, include an "elements" array. Use unique "id" values. Follow the exact structure shown in examples.
        Use strict the following elements only: ${elements.join(",")}.
        If you need to use a element like: ${ [...new Set(Object.keys(inputType))].join(", ")} strict use element="input" and set format in data.format: ${ [...new Set(Object.keys(inputType))].join(", ")}.
        `,
    },
    user: {
      content: `Resolve the following request:"${prompt}"`
    }
  }

  return `I have a template generator that generates forms and pages with these elements: ${elements.join(",")},
                 based on a metadata structure like this: ${JSON.stringify(exampleJSON)} resolve the following request:
                  "${prompt}", I need the metadata in JSON not in html, strictly with the format that I have shown you. Each element compulsorily requires the data with the name, label and id as a minimum.`
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