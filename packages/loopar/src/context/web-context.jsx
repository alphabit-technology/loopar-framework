import BaseDocument from "@context/base/base-document";
import { WebLayout } from "./views/layouts";

export { WebView as View } from "./views";

/** Legacy class context. Prefer `WebView`. */
export default class WebContext extends BaseDocument {
  render(content = [], slots) {
    return super.render(<WebLayout ctrl={this}>{content}</WebLayout>, slots);
  }
}
