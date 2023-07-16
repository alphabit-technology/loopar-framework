import Div from "/components/elements/div.js";
import { elements } from "/components/elements.js";
import { data_interface } from "/element-definition.js";
import { label } from "/components/elements.js";
import { Capitalize, value_is_true } from "../../tools/helper.js";
import { element_manage } from "../element-manage.js";

export class BaseInput extends Div {
   input_tag_name = 'input';
   input_type = 'text';
   autocomplete = 'off';
   group_element = INPUT;
   is_writable = true;
   droppable = false;
   names = null;

   constructor(props) {
      super(props);
      this.handleInputChange = this.handleInputChange.bind(this);

      this.state = {
         ...this.state,
         withoutLabel: props.withoutLabel,
         simpleInput: props.simpleInput,
         size: props.size,
         focus: props.focus,
         meta: props.meta,
         is_invalid: false,
      }
   }

   componentDidMount() {
      super.componentDidMount();
      if (this.state.simpleInput !== true) this.addClass('form-group');
      if (this.data.hidden && !this.props.designer) this.hide();
      if (this.state.focus) this.focus();

      if (this.state.withoutLabel && this.label && this.label.node && ![CHECKBOX, SWITCH].includes(this.props.element)) this.label.node.style.setProperty("display", "none", "important");
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
      if (prevProps.meta !== this.props.meta) {
         this.setState({
            meta: this.props.meta
         }, () => {
            !this.props.designer && this.props.formRef && this.validate();
         });
      }

      if (this.state.withoutLabel && this.label && this.label.node && ![CHECKBOX, SWITCH].includes(this.props.element)) this.label.node.style.setProperty("display", "none", "important");
   }

   handleInputChange(event) {
      const value = event.target.value;
      try {
         const data = this.data;
         data.value = value;
         this.state.meta.data = data;
         this.setState({ meta: this.state.meta });

         this.props.onChange && this.props.onChange(event);
         this.onChange && this.onChange(event);
         this.validate();
      } catch (e) {
         console.log("Error on handleInputChange", e)
      }
   }

   get meta() {
      return this.state.meta;
   }

   get data() {
      this.names ??= element_manage.element_name(this.props.element);
      const data = this.meta.data || {};

      //data.id ??= names.id;
      data.id = this.names.id;
      data.name ??= this.names.name;
      data.label ??= Capitalize(data.name.replaceAll('_', ' '));

      return data;
   }

   get_structure() {
      const data = this.data
      const inputClass = `form-control${data.size ? ` form-control-${data.size}` : ''}${this.state.is_invalid ? ' is-invalid' : ''}`;

      return [
         label({
            key: data.id + '_label',
            ref: label => this.label = label,
            className: `col-form-label ${data.class || ''} text-left ${data.size ? `col-form-label-${data.size}` : ''}`,
            htmlFor: data.id,
            style: { padding: 2 }
         }, data.label),
         elements({
            key: data.id,
            ref: input => this.input = input,
            value: (this.input_type === "file" ? [] : data.value),
            type: [CHECKBOX, SWITCH, PASSWORD].includes(this.props.element) ? this.input_type : (data.format || this.input_type),
            name: data.name || data.id,
            autoComplete: this.autocomplete,
            className: inputClass + ` ${this.visible_input === false ? 'd-none' : ''}`,
            id: data.id,
            placeholder: data.placeholder || data.label,
            onChange: (e) => {
               this.handleInputChange(e);
            },
            ...([CHECKBOX, SWITCH].includes(this.input_type) ? { checked: value_is_true(data.value) } : {}),
            ...(this.input_tag_name === "textarea" ? { rows: data.rows || 5 } : {}),
            ...(this.input_type === "file" ? { multiple: this.state.multiple, accept: this.state.accept } : {}),
            
         }).tag(this.input_tag_name)
      ]
   }

   render(content = []) {
      const structure = this.get_structure();
      const meta = this.meta;

      return super.render([
         ...([SWITCH, CHECKBOX].includes(this.props.element) ? structure.reverse() : structure),
         ...content
      ]);
   }

   focus() {
      this.input?.node?.focus();
   }

   on(event, callback) {
      this.input?.on(event, callback);
   }

   disable(on_disable = true) {
      super.disable(on_disable);

      this.input.prop('disabled', true);
   }

   enable(on_enable = true) {
      super.enable(on_enable);

      this.input.prop('disabled', true);
   }

   val(val = null, { event_change = true, focus = false } = {}) {
      if (val === null) {
         return this.input ? this.data.value : null;
      } else {
         this.handleInputChange({ target: { value: val } });
      }
   }

   get #datatype() {
      const type = (this.element === INPUT ? (this.data.format || this.element) : this.element).toLowerCase();

      return type;
   }

   getName() {
      return this.data.name;
   }

   validate() {
      const validation = data_interface(this).validate();
      this.setState({ is_invalid: !validation.valid });
      return validation;
   }

   set_size(size = 'md') {
      this.input.removeClass(`form-control-${this.data.size}`).addClass(`form-control-${size}`);
      this.label.removeClass(`col-form-label-${this.data.size}`).addClass(`col-form-label-${size}`);
      this.data.size = size;

      return this;
   }

   /*focus() {
      this.input?.focus();
   }*/
}