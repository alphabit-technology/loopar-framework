import BaseForm from "@context/base/base-form";
import { FormLayout } from "./views/layouts";

export { ViewView as View } from "./views";

/** Legacy class context (read-only form). Prefer `ViewView`. */
export default class ViewContext extends BaseForm {
  canUpdate = false;
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;
  donHaveContainer = true;
  formFields = {};

  render(content, slots) {
    if (content) return content;

    return super.render(<FormLayout ctrl={this} />, slots);
  }
}
