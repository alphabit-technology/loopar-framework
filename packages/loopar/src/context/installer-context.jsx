import MetaComponent from "@meta-component";
import { FormWrapper } from "./form-provider";
import BaseForm from "@context/base/base-form";

export default class InstallerContext extends BaseForm {
  notRequireChanges = true;
  controller = "System";

  constructor(options) {
    super(options);
  }

  render(content = [], slots) {
    return super.render(
      <FormWrapper __DATA__={this.Document.data} STRUCTURE={this.__STRUCTURE__} docRef={this}>
        <MetaComponent elements={this.__STRUCTURE__} parent={this} />
        {content}
      </FormWrapper>,
      slots
    );
  }

  async install() {
    await this.send({ action: "install" });
  }

  async connect() {
    await this.send({ action: "connect" });
  }
}