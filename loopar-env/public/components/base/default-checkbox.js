import {BaseInput} from "./base-input.js";
import {value_is_true} from "../../tools/helper.js";

export class DefaultCheckbox extends BaseInput {
   input_type = 'checkbox';

   constructor(props) {
      super(props);
   }

   render() {
      return super.render();
   }

   handleInputChange(event) {
      const data = this.data;
      const current_value = value_is_true(data.value);
      const value= current_value ? 0 : 1;
      event.target.value = value;
      data.value = value;
      this.state.meta.data = data;
      try {
         this.setState({meta: this.state.meta});

         this.props.onChange && this.props.onChange(event);

         this.onChange && this.onChange(event);
      }catch (e) {}
   }

   componentDidUpdate(prevProps) {
      super.componentDidUpdate(prevProps);
      this.input.addClass("custom-control-input");
      this.label.removeClass("col-form-label").addClass("custom-control-label d-block");
   }

   componentDidMount() {
      super.componentDidMount();
      this.addClass(`custom-control custom-${this.props.element}`);
   }

   val(val){
      if (val != null) {
         val = value_is_true(val) ? 1 : 0;
         const data = this.data;
         data.value = val;
         this.setState({data});
         this.onChange && this.onChange({target: {checked: val}});
      } else {
         return value_is_true(this.data.value) ? 1 : 0;
      }
   }
}