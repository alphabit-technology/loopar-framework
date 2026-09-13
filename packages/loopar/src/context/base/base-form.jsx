import BaseDocument from "@context/base/base-document";
import { mixin } from "../controller/mixin";
import { initFormController, formControllerMethods } from "../controller/form-controller";

/**
 * Legacy class adapter over `controller/form-controller` (shared with
 * `useFormController()`). See `base-document.jsx`.
 */
export default class BaseForm extends BaseDocument {
  constructor(props) {
    super(props);
    initFormController(this);
  }
}

mixin(BaseForm.prototype, formControllerMethods);
