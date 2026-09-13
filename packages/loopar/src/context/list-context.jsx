import BaseDocument from "@context/base/base-document";
import { ListLayout } from "./views/layouts";

export { ListView as View } from "./views";

/** Legacy class context. Prefer `ListView`. */
export default class ListContext extends BaseDocument {
  hasHeader = true;
  hasSidebar = true;
  context = 'index';
  renderStructure = false;
  hasSearchForm = true;
  hasSelectAll = true;
  hasSelectRow = true;

  render(content, slots) {
    return super.render(
      <ListLayout
        ctrl={this}
        hasSearchForm={this.hasSearchForm}
        onlyGrid={this.onlyGrid}
        onlyList={this.onlyList}
      >
        {content}
      </ListLayout>,
      slots
    );
  }

  componentDidMount() {
    super.componentDidMount();
    this.setCustomActions();
  }
}
