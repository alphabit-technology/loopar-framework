var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { B as BaseInput } from "./base-input-uYDrqEOF.js";
import { l as loopar } from "../entry-server.js";
class DefaultCheckbox extends BaseInput {
  constructor() {
    super(...arguments);
    __publicField(this, "inputType", "checkbox");
  }
  handleInputChange(event) {
    let value = null;
    if (typeof event === "object") {
      event.target.value = loopar.utils.trueToBinary(event.target.checked);
    } else {
      event = { target: { value: loopar.utils.trueToBinary(event) } };
    }
    return super.handleInputChange(event, value);
  }
}
export {
  DefaultCheckbox as D
};
