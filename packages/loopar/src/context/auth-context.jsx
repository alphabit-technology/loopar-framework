import MetaComponent from "@meta-component";
import {FormWrapper} from "@context/form-provider";
import BaseForm from "@context/base/base-form";

export default class AuthContext extends BaseForm {
  render(content = [], slots) {
    return super.render(
      <FormWrapper __DATA__={this.Document.data} docRef={this}>
        <MetaComponent elements={this.__STRUCTURE__} parent={this} />
        {content}
      </FormWrapper>,
      slots
    );
  }
}