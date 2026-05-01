import BaseDocument from "@context/base/base-document";
import MetaComponent from "@meta-component";

export default class PageContext extends BaseDocument {
  render(content = [], slots) {
    return super.render(
      <>
        <MetaComponent elements={this.__STRUCTURE__} parent={this}/>
        {content}
      </>,
      slots
    );
  }

  componentDidMount() {
    super.componentDidMount();
    this.initScroll();
  }
}
