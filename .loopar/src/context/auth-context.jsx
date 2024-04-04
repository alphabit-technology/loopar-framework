import DynamicComponent from "$dynamic-component";
import {FormWrapper} from "@context/form-context";
import BaseForm from "@context/base/base-form";

export default class AuthContext extends BaseForm {
  render(content = []) {
    const meta = this.props.meta;

    return super.render([
      <FormWrapper meta={meta} docRef={this}>
        <DynamicComponent elements={JSON.parse(meta.__DOCTYPE__.doc_structure)} parent={this} />
        {content}
      </FormWrapper>
    ]);
  }
}