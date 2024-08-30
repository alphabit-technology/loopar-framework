import MetaComponent from "@meta-component";
import {FormWrapper} from "@context/form-context";
import BaseForm from "@context/base/base-form";

export default class AuthContext extends BaseForm {
  render(content = []) {
    const meta = this.props.meta;

    return super.render([
      <FormWrapper meta={meta} docRef={this}>
        <MetaComponent elements={JSON.parse(meta.__ENTITY__.doc_structure)} parent={this} />
        {content}
      </FormWrapper>
    ]);
  }
}