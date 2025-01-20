import DeskGUI from "@context/base/desk-gui";
import BaseForm from "@context/base/base-form";
import MetaComponent from "@meta-component";
import { FormWrapper } from "./form-provider";

interface DataInterface {
  id: String,
  name: String,
  type: String,
  label: String,
  description: String,
  placeholder: String,
  required: Boolean,
  value: String,
  hidden: Number
}

interface Element {
  element: String,
  data: DataInterface,
  docRef: FormContext
}

export default class FormContext extends BaseForm {
  canUpdate = true;
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;
  donHaveContainer = true;
  formFields: { [key: string]: any } = {};

  render(content: React.ReactNode) {
    if (content) return content;
    const meta = this.meta;
    const STRUCTURE = this.__STRUCTURE__;

    return super.render(
      <FormWrapper __DOCUMENT__={meta.__DOCUMENT__} docRef={this}>
        <DeskGUI docRef={this}>
          {[
            ...STRUCTURE.map((el: Element) => {
              const e = el.element
              if (el.data.hidden) return null;

              return (
                <MetaComponent
                  elements={[
                    {
                      element: e,
                      ...el
                    },
                  ]}
                />
              );
            })
          ]}
        </DeskGUI>
      </FormWrapper>
    );
  }
}
