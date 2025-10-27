import BaseDocument from "@context/base/base-document";
import MetaComponent from "@meta-component";

export default class PageContext extends BaseDocument {
  render(content = []) {
    return super.render([
      <MetaComponent elements={JSON.parse(this.Document.Entity.doc_structure)} parent={this}/>,
      content
    ]);
  }

  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }
}