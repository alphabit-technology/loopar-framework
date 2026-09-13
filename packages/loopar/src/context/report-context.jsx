import BaseDocument from "@context/base/base-document";
import { ReportLayout } from "./views/layouts";

export { ReportView as View } from "./views";

/** Legacy class context. Prefer `ReportView`. */
export default class ReportContext extends BaseDocument {
  hasSidebar = true;
  hasHeader = true;
  hasHistory = true;

  render(content, slots) {
    return super.render(<ReportLayout ctrl={this}>{content}</ReportLayout>, slots);
  }
}
