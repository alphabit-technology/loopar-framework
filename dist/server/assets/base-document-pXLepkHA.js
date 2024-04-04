var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { B as BaseComponent } from "./base-component-BnGRdg1n.js";
import { l as loopar } from "../entry-server.js";
class BaseDocument extends BaseComponent {
  constructor(props) {
    super(props);
    __publicField(this, "dontHaveContainer", true);
    __publicField(this, "customActions", {});
    __publicField(this, "handleBeforeUnload", () => {
      this.setScrollPosition();
    });
    this.state = {
      ...this.state,
      sidebarOpen: false,
      design: false,
      preview: false
    };
  }
  get meta() {
    return this.state.meta || this.props.meta || {};
  }
  get __DOCTYPE__() {
    return this.meta.__DOCTYPE__;
  }
  get __STRUCTURE__() {
    return JSON.parse(this.__DOCTYPE__.doc_structure || "{}");
  }
  get __FIELDS__() {
    console.log(["on Get Fields", this.__STRUCTURE__]);
    const mapFields = (fields) => {
      return fields.reduce((fields2, field) => {
        fields2.push({
          data: field.data,
          def: ELEMENT_DEFINITION(field.element)
        });
        if (field.elements) {
          return fields2.concat(mapFields(field.elements));
        }
        return fields2;
      }, []);
    };
    return mapFields(this.__STRUCTURE__);
  }
  __FIELD__(fieldName) {
    return this.__FIELDS__.find((field) => field.data.name === fieldName);
  }
  setCustomAction(name, action) {
    this.customActions[name] = action;
    this.setState({});
  }
  setCustomActions() {
  }
  componentDidMount() {
    super.componentDidMount();
    setTimeout(() => {
      const root = document.getElementById("loopar-root");
      if (root) {
        root.style.display = "block";
      }
    });
    this.initScroll();
  }
  getPageKey() {
    return this.meta.key;
  }
  getCurrentScrollPosition() {
    return loopar.utils.cookie.get(this.getPageKey()) || window.scrollY || window.pageYOffset;
  }
  initScroll() {
    const scrollPosition = loopar.utils.cookie.get(this.getPageKey()) || 0;
    window.scrollTo(0, scrollPosition);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }
  setScrollPosition() {
    loopar.utils.cookie.set(this.getPageKey(), window.scrollY || window.pageYOffset);
  }
  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }
}
export {
  BaseDocument as B
};
