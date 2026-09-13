import BaseForm from "@context/base/base-form";
import { BareFormLayout } from "./views/layouts";

export { AuthView as View } from "./views";

/** Legacy class context. Prefer `AuthView`. */
export default class AuthContext extends BaseForm {
  controller = "Auth";

  render(content = [], slots) {
    return super.render(
      <BareFormLayout ctrl={this} withStructure={false}>{content}</BareFormLayout>,
      slots
    );
  }
}
