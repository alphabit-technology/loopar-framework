import BaseDocument from "@context/base/base-document";
import { PageLayout } from "./views/layouts";

export { PageView as View } from "./views";

/** Legacy class context. Prefer `PageView`. */
export default class PageContext extends BaseDocument {
  render(content = [], slots) {
    return super.render(<PageLayout ctrl={this}>{content}</PageLayout>, slots);
  }
}
