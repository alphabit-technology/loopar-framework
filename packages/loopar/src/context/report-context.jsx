import BaseDocument from "@context/base/base-document";
import MetaComponent from "@meta-component";
import DeskGUI from "@context/base/desk-gui";
import { FormWrapper } from "@context/form-provider";

export default class ReportContext extends BaseDocument {
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;

  constructor(props) {
    super(props);
  }

  render(content, slots) {
    return super.render(
      <FormWrapper __DATA__={this.Document.data} STRUCTURE={this.__STRUCTURE__} docRef={this}>
        <DeskGUI
          docRef={this}
        >
          <>
          <MetaComponent elements={this.__STRUCTURE__} parent={this}/>
          {content}
          </>
        </DeskGUI>
      </FormWrapper>,
      slots
    );
  }
}