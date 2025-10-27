import MetaComponent from "@meta-component";
import { FormWrapper } from "./form-provider";
import BaseForm from "@context/base/base-form";

export default class InstallerContext extends BaseForm {
  notRequireChanges = true;
  constructor(options) {
    super(options);
  }

  render(content = []) {
    const Document = this.Document;

    return super.render([
      <FormWrapper Document={Document} docRef={this}>
        <MetaComponent elements={JSON.parse(Document.Entity.doc_structure)} parent={this} />
        {content}
      </FormWrapper>
    ]);
  }

  async install() {
    await this.send({ action: "install" });
  }

  async connect() {
    await this.send({ action: "connect" });
  }
}