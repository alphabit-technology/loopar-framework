import BaseForm from "@context/base/base-form";
import { FormLayout } from "./views/layouts";

/** Functional counterpart (used by the loader when an entity ships no view). */
export { FormView as View } from "./views";

/**
 * Legacy class context. Prefer `FormView` / `useFormController` for new
 * views; this class stays for existing `extends FormContext` subclasses.
 */
export default class FormContext extends BaseForm {
  canUpdate = true;
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;
  donHaveContainer = true;
  formFields = {};

  render(content, slots) {
    if (content) return content;

    return super.render(
      <FormLayout ctrl={this}>{this.props.children}</FormLayout>,
      slots
    );
  }
}
