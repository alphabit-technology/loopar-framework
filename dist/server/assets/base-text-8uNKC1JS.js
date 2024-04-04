var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { C as Component } from "./component-hNq1V6er.js";
class BaseText extends Component {
  constructor() {
    super(...arguments);
    __publicField(this, "dontHaveMetaElements", ["label"]);
    __publicField(this, "defaultText", "Text here");
  }
  /*componentDidMount(prevProps, prevState, snapshot) {
        super.componentDidMount(prevProps, prevState, snapshot);
        const meta = this.props;
  
        setTimeout(() => {
           if (!meta.data.text) {
              this.props.designerRef.updateElement(meta.data.key, {
                 text: this.defaultText
              }, true);
           }
        }, 100);
     }*/
  getText() {
    return this.props.data.text || this.defaultText;
  }
}
export {
  BaseText as B
};
