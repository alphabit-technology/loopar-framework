import DeskGUI from "@context/base/desk-gui";
import BaseForm from "@context/base/base-form";
import MetaComponent from "@meta-component";
import { FormWrapper, type FormStructureElement } from "./form-provider";

export default class FormContext extends BaseForm {
  canUpdate = true;
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;
  donHaveContainer = true;
  formFields: { [key: string]: any } = {};

  render(content: React.ReactNode, slots: {}) {
    if (content) return content;
    const STRUCTURE = this.__STRUCTURE__;

    return super.render(
      <FormWrapper __DATA__={this.Document.data} STRUCTURE={STRUCTURE} docRef={this}>
        <DeskGUI docRef={this}>
          {STRUCTURE.map((el: FormStructureElement, idx: number) => {
            const e = el.element;
            if (!e || !el.data || el.data?.hidden) return null;

            return (
              <MetaComponent
                key={el.data?.name ?? idx}
                elements={[
                  {
                    element: e,
                    ...el
                  },
                ]}
              />
            );
          })}
        </DeskGUI>
      </FormWrapper>,
      slots
    );
  }
}
