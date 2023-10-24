import { BaseInput } from "../base/base-input.js";

export default class Textarea extends BaseInput {
   inputTagName = 'textarea';

   constructor(props) {
      super(props);
   }
}