var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var _datatype, datatype_get;
import { jsx } from "react/jsx-runtime";
import DivComponent from "./div-rCeXGfsc.js";
import { l as loopar, c as cn } from "../entry-server.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import { F as FormField } from "./form-field-WWLBJIO2.js";
import { c as FormItem } from "./form-z4zN6fsS.js";
import { B as BaseFormContext } from "./form-context-8n26Uc_0.js";
class BaseInput extends DivComponent {
  constructor(props) {
    super(props);
    __privateAdd(this, _datatype);
    __publicField(this, "inputTagName", "input");
    __publicField(this, "inputType", "text");
    __publicField(this, "autocomplete", "off");
    __publicField(this, "groupElement", INPUT);
    __publicField(this, "isWritable", true);
    __publicField(this, "droppable", false);
    __publicField(this, "names", null);
    __publicField(this, "dontHaveMetaElements", ["text"]);
    __publicField(this, "visibleInput", true);
    __publicField(this, "dontHaveContainer", true);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.state = {
      ...this.state,
      focus: props.focus,
      is_invalid: false,
      data: props.data || {}
    };
  }
  get droppable() {
    return false;
  }
  handleInputChange(event) {
    if (event && typeof event === "object") {
      event.target ?? (event.target = {});
      event.target.value = event.target.files || event.target.value;
    } else {
      event = { target: { value: event } };
    }
    this.props.onChange && this.props.onChange(event);
    this.onChange && this.onChange(event);
    this.validate();
  }
  set data(data) {
    this.setState({ data });
  }
  get data() {
    this.names ?? (this.names = elementManage.elementName(this.props.element));
    const data = this.state.data || this.props.data || {};
    data.id ?? (data.id = this.names.id);
    data.name ?? (data.name = this.names.name);
    data.label ?? (data.label = loopar.utils.Capitalize(data.name.replaceAll("_", " ")));
    const attributtes = ["readonly", "hidden", "mandatory", "disabled"];
    return Object.entries(data).reduce((acc, [key, value]) => {
      if (attributtes.includes(key)) {
        value == 1 && (acc[key] = true);
      } else if (key !== "id" && key !== "required") {
        acc[key] = value;
      }
      return acc;
    }, {});
  }
  get readOnly() {
    return this.props.readOnly || this.data.readOnly;
  }
  hasLabel() {
    return !(this.props.withoutLabel === true);
  }
  renderInput(input, className = "") {
    const data = this.data;
    return /* @__PURE__ */ jsx(
      FormField,
      {
        name: data.name,
        dontHaveForm: this.props.dontHaveForm,
        render: ({ field }) => {
          this.fieldControl = field;
          const olChange = field.onChange;
          field.onChange = (e) => {
            this.handleInputChange(e);
            olChange(e);
          };
          return /* @__PURE__ */ jsx(FormItem, { className: cn("flex flex-col mb-2 rounded-lg shadow-sm", className), children: input(field) });
        },
        onChange: this.handleInputChange,
        data
      }
    );
  }
  focus() {
    var _a, _b;
    (_b = (_a = this.input) == null ? void 0 : _a.node) == null ? void 0 : _b.focus();
  }
  on(event, callback) {
    var _a;
    (_a = this.input) == null ? void 0 : _a.on(event, callback);
  }
  disable(on_disable = true) {
    super.disable(on_disable);
    this.input.prop("disabled", true);
  }
  enable(on_enable = true) {
    super.enable(on_enable);
    this.input.prop("disabled", true);
  }
  val(val = null, { event_change = true, focus = false } = {}) {
    if (val === null) {
      return this.fieldControl.value;
    } else {
      this.fieldControl.onChange({ target: { value: val } });
    }
  }
  value(val, { event_change = true, focus = false } = {}) {
    if (typeof val === "undefined")
      return this.fieldControl.value;
    this.fieldControl.value = val;
    this.fieldControl.onChange({ target: { value: val } });
  }
  getName() {
    return this.data.name;
  }
  validate() {
  }
  setSize(size = "md") {
    this.input.removeClass(`form-control-${this.data.size}`).addClass(`form-control-${size}`);
    this.data.size = size;
    return this;
  }
  /*focus() {
      this.input?.focus();
   }*/
  get metaFields() {
    return [
      {
        group: "form",
        elements: {
          //tag: {element: INPUT},
          label: { element: INPUT },
          name: { element: INPUT },
          description: { element: TEXTAREA },
          placeholder: { element: TEXTAREA },
          format: {
            element: SELECT,
            data: {
              options: [
                { option: "data", value: "Data" },
                { option: "text", value: "Text" },
                { option: "email", value: "Email" },
                { option: "decimal", value: "Decimal" },
                { option: "percent", value: "Percent" },
                { option: "currency", value: "Currency" },
                { option: "int", value: "Int" },
                { option: "long_int", value: "Long Int" },
                { option: "password", value: "Password" },
                { option: "read_only", value: "Read Only" }
              ],
              selected: "data"
            }
          },
          type: {
            element: SELECT,
            data: {
              options: [
                { option: "default", value: "Default" },
                { option: "primary", value: "Primary" },
                { option: "success", value: "Success" },
                { option: "info", value: "Info" },
                { option: "link", value: "link" }
              ],
              selected: "default",
              description: "Valid for not preformated inputs"
            }
          },
          //action: { element: INPUT },
          not_validate_type: { element: SWITCH },
          required: { element: SWITCH },
          unique: { element: SWITCH },
          set_only_time: { element: SWITCH },
          readonly: { element: SWITCH },
          in_list_view: { element: SWITCH },
          searchable: { element: SWITCH }
        }
      }
    ];
  }
}
_datatype = new WeakSet();
datatype_get = function() {
  const type = (this.element === INPUT ? this.data.format || this.element : this.element).toLowerCase();
  return type;
};
__publicField(BaseInput, "contextType", BaseFormContext);
export {
  BaseInput as B
};
