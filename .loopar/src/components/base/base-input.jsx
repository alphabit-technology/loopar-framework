import DivComponent from "$div";
import { dataInterface } from "$global/element-definition";
import elementManage from "$tools/element-manage";
import loopar from "$loopar";
import { FormField } from "@form-field";
import {
  FormItem,FormMessage
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { BaseFormContext } from "@context/form-context";

export default class BaseInput extends DivComponent {
  get droppable(){return false};

  inputTagName = "input";
  inputType = "text";
  autocomplete = "off";
  groupElement = INPUT;
  isWritable = true;
  droppable = false;
  names = null;
  dontHaveMetaElements = ["text"];
  visibleInput = true;
  dontHaveContainer = true;
  static contextType = BaseFormContext;

  constructor(props) {
    super(props);
    this.handleInputChange = this.handleInputChange.bind(this);

    this.state = {
      ...this.state,
      focus: props.focus,
      isInvalid: false,
      data: props.data || {}
    };
  }

  handleInputChange(event) {
    if(event && typeof event === "object") {
      event.target ??= {};
      event.target.value = (event.target.files || event.target.value);
    }else{
      event = { target: { value: event}};
    }

    setTimeout(() => {
      this.validate();
      this.props.onChange && this.props.onChange(event);
      //setTimeout necessary to witing for the onChange event to be called
      this.onChange && this.onChange(event);
    }, 0);
  }

  set data(data) {
    this.setState({ data });
  }

  get data() {
    this.names ??= elementManage.elementName(this.props.element);
    const data = this.state.data || this.props.data || {};

    data.id ??= this.names.id;
    data.name ??= this.names.name;
    data.label ??= loopar.utils.Capitalize(data.name.replaceAll("_", " "));

    return data;
  }

  get readOnly() {
    return this.props.readOnly || this.data.readOnly;
  }

  hasLabel(){
    return !(this.props.withoutLabel === true);
  }

  renderInput(input, className=""){
    const data = this.data;
  
    const invalidClassName = this.state.isInvalid ? "border border-red-500 p-2" : "";
    return (
      <FormField
        name={data.name}
        dontHaveForm={this.props.dontHaveForm}
        render={({ field }) => {
          field.value ??= data.value;
          this.fieldControl = field;
          const oldChange = field.onChange;

          field.onChange = (e) => {
            this.handleInputChange(e);
            oldChange(e);
          }

          //field.refObject = this;
          return <FormItem className={cn("flex flex-col mb-2 rounded-lg shadow-sm", invalidClassName, className)}>
            {input(field)}
            <FormMessage>
              {field.message || (this.state.isInvalid && this.state.invalidMessage)}
            </FormMessage>
          </FormItem>}
        }
        onChange={this.handleInputChange}
        data={data}
      />
    )
  }

  focus() {
    this.input?.node?.focus();
  }

  on(event, callback) {
    this.input?.on(event, callback);
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
    if(val === null) {
      return this.fieldControl.value;
    }else {
      this.fieldControl.onChange({target: {value: val}});
    }
    /*if (val === null) {
      return this.input ? this.data.value : null;
    } else {
      this.handleInputChange({ target: { value: val } });
    }*/
  }

  value(val, { event_change = true, focus = false } = {}) {
    if(typeof val === "undefined") return this.fieldControl.value;

    this.fieldControl.value = val;
    setTimeout(() => {
      this.fieldControl.onChange({target: {value: val}});
    },0);
  }

  get #datatype() {
    const type = (
      this.element === INPUT ? this.data.format || this.element : this.element
    ).toLowerCase();

    return type;
  }

  getName() {
    return this.data.name;
  }

  validate() {
    const validation = dataInterface(this, this.value()).validate();
    this.setState({ isInvalid: !validation.valid, invalidMessage: validation.message});
    return validation;
  }

  setSize(size = "md") {
    this.input
      .removeClass(`form-control-${this.data.size}`)
      .addClass(`form-control-${size}`);
    //this.label.removeClass(`col-form-label-${this.data.size}`).addClass(`col-form-label-${size}`);
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
                { option: "read_only", value: "Read Only" },
              ],
              selected: "data",
            },
          },
          type: {
            element: SELECT,
            data: {
              options: [
                { option: "default", value: "Default" },
                { option: "primary", value: "Primary" },
                { option: "success", value: "Success" },
                { option: "info", value: "Info" },
                { option: "link", value: "link" },
              ],
              selected: "default",
              description: "Valid for not preformated inputs",
            },
          },
          //action: { element: INPUT },

          not_validate_type: { element: SWITCH },
          required: { element: SWITCH },
          unique: { element: SWITCH },
          set_only_time: { element: SWITCH },
          readonly: { element: SWITCH },
          in_list_view: { element: SWITCH },
          searchable: { element: SWITCH },
        },
      },
    ];
  }
}
