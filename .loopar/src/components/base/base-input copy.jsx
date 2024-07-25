import { dataInterface } from "$global/element-definition";
import elementManage from "$tools/element-manage";
import loopar from "$loopar";
import { FormField } from "@form-field";
import {
  FormItem,FormMessage
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { BaseFormContext } from "@context/form-context";
import Component from "@component";

export default class BaseInput extends Component {
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
      
      this.onChange && this.onChange(event);
      this.props.onChanged && this.props.onChanged(event);
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
          //field.value ??= data.value;
          if(!this.fieldControl) field.value = data.value;
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

  componentDidUpdate(prevProps, prevState) {
    super.componentDidUpdate(prevProps, prevState);

    if (this.props.onChange && !prevProps.onChange) {
      this.handleInputChange(this.value());
    }
  }

  value(val) {
    if(typeof val === "undefined") return this.fieldControl?.value;

    if(!this.fieldControl) return;
    
    this.fieldControl.value = val;
    setTimeout(() => {
      this.fieldControl.onChange({target: {value: val}});
    },0);
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
    this.data.size = size;

    return this;
  }
}

const metaFields =()=>{
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