import { BaseInput } from "../base/base-input.js";

export default class Password extends BaseInput {
   inputType = 'password';

   constructor(props) {
      super(props);
   }
}