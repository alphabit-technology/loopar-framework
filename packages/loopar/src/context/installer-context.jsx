import BaseForm from "@context/base/base-form";
import { BareFormLayout } from "./views/layouts";

export { InstallerView as View } from "./views";

/** Legacy class context. Prefer `InstallerView`. */
export default class InstallerContext extends BaseForm {
  notRequireChanges = true;
  controller = "System";

  render(content = [], slots) {
    return super.render(<BareFormLayout ctrl={this}>{content}</BareFormLayout>, slots);
  }

  async install() {
    await this.send({ action: "install" });
  }

  async connect() {
    await this.send({ action: "connect" });
  }
}
