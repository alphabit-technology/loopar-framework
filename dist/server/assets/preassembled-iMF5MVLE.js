var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import { C as Component } from "./component-hNq1V6er.js";
class Preassembled extends Component {
  /*defaultElements = [
     {
        element: "title",
        meta:{
           data: {
              name: "text_block_title",
              id: "text_block_title",
              label: "Text Block Title",
              key: "text_block_title",
           }
        },
        //key: elementName.id,
        designer: true,
        hasTitle: true,
     }
  ]*/
  constructor(props) {
    super(props);
    __publicField(this, "defaultText", "I'm a awesome Text Block widget, you can customize in edit button in design mode.");
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    var _a;
    super.componentDidUpdate(prevProps, prevState, snapshot);
    if ((!this.props.elements || ((_a = this.props.elements) == null ? void 0 : _a.length) === 0) && this.props.designer) {
      const prepareElements = (elements) => {
        return elements.map((el) => {
          var _a2, _b;
          el.data ?? (el.data = {});
          el.designer = true;
          el.hasTitle = true;
          (_a2 = el.data).key ?? (_a2.key = elementManage.getUniqueKey());
          if (((_b = el.elements) == null ? void 0 : _b.length) > 0) {
            el.elements = prepareElements(el.elements);
          }
          return el;
        });
      };
      this.setElements(prepareElements(this.defaultElements || []), null, false);
    }
  }
}
export {
  Preassembled as P
};
