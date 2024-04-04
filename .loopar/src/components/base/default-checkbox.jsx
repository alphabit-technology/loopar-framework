import BaseInput from "$base-input";
import loopar from "$loopar";

export default class DefaultCheckbox extends BaseInput {
   inputType = 'checkbox';

   handleInputChange(event) {
      let value = null;
      if(typeof event === "object") {
         event.target.value = loopar.utils.trueToBinary(event.target.checked);
      }else{
         event = { target: { value: loopar.utils.trueToBinary(event) } };
      }

      return super.handleInputChange(event, value);
   }
}