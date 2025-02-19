import BaseDocument from "@context/base/base-document";
import MetaComponent from "@meta-component";

export default class PageContext extends BaseDocument {
  constructor(props) {
    super(props);
  }

  render(content = []) {
    return super.render([
      <MetaComponent elements={JSON.parse(this.meta.__ENTITY__.doc_structure)} parent={this}/>,
      content
    ]);
  }

  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }
}