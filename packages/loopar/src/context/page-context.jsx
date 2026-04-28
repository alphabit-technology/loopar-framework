import BaseDocument from "@context/base/base-document";
import MetaComponent from "@meta-component";

export default class PageContext extends BaseDocument {
  render(content = [], slots) {
    return super.render([
      <>
        <MetaComponent elements={JSON.parse(this.Document.Entity.doc_structure)} parent={this}/>
        {content}
      </>
    ],
      slots
    );
  }

  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }
}