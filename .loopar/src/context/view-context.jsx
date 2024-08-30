import BaseDocument from "$context/base/base-document";
import MetaComponent from "@meta-component";
import DeskGUI from "@context/base/desk-gui";
import { FormWrapper } from "$context/form";

export default class View extends BaseDocument {
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;

  constructor(props) {
    super(props);
  }

  render(content) {
    const meta = this.props.meta;

    return super.render(
      <FormWrapper>
        <DeskGUI
          docRef={this}
        >
          <>
          <MetaComponent elements={JSON.parse(meta.__ENTITY__.doc_structure)} parent={this}/>
          {content}
          </>
        </DeskGUI>
      </FormWrapper>
    );
  }
}