import MetaComponent from "@meta-component";
import {FormWrapper} from "@context/form-provider";
import BaseForm from "@context/base/base-form";

export default class AuthContext extends BaseForm {
  render(content = []) {
    return super.render([
      <FormWrapper __DATA__={this.Document.data} docRef={this}>
        <MetaComponent elements={JSON.parse(this.Document.Entity.doc_structure)} parent={this} />
        {content}
      </FormWrapper>
    ]);
  }
}