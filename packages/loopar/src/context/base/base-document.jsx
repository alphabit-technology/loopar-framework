import React from "react";
import { mixin } from "../controller/mixin";
import { initDocumentController, documentControllerMethods } from "../controller/document-controller";
import { DocumentShell } from "../views/document-shell";

/**
 * Legacy class adapter. All behaviour lives in `controller/document-controller`
 * (shared with `useDocumentController()`); this class only bridges React's
 * class lifecycle to it so existing `extends PageContext / ListContext`
 * views keep working unchanged. New views should be functions.
 */
export default class BaseDocument extends React.Component {
  constructor(props) {
    super(props);
    initDocumentController(this);
    this.state = { ...this.state, Document: props.Document };
  }

  rerender() {
    this.setState({});
  }

  render(content, slots) {
    return (
      <DocumentShell ctrl={this} slots={slots}>
        {content}
      </DocumentShell>
    );
  }

  componentDidMount() {
    this.mount();
  }

  componentWillUnmount() {
    this.unmount();
  }
}

mixin(BaseDocument.prototype, documentControllerMethods);
