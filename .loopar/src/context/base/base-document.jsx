import BaseComponent from "$base-component";
import loopar from "$loopar";
import {DocumentContext} from "@context/base/base-context";
import { WorkspaceProviderContext } from "@workspace/workspace-provider";


export default class BaseDocument extends BaseComponent {
  dontHaveContainer = true;
  customActions = {};
  __REFS__ = {};
  static contextType = WorkspaceProviderContext;

  constructor(props) {
    super(props);
  }

  render(content) {
    return (
      <DocumentContext.Provider value={{ docRef: this }}>
        {content}
      </DocumentContext.Provider>
    );
  }

  get(name){
    return this.__REFS__[name];
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
    const mapFields = (fields) => {
      return fields.reduce((fields, field) => {
        fields.push({
          data: field.data,
          def: ELEMENT_DEFINITION(field.element)
        });

        if (field.elements) {
          return fields.concat(mapFields(field.elements));
        }

        return fields;
      }, []);
    }

    return mapFields(this.__STRUCTURE__);
  }

  __FIELD__(fieldName) {
    return this.__FIELDS__.find(field => field.data.name === fieldName);
  }

  setCustomAction(name, action) {
    this.customActions[name] = action;
    this.setState({});
  }

  setCustomActions() { }

  componentDidMount() {
    super.componentDidMount();
    setTimeout(() => {
      console.log(["BaseDocument", this.context])
      this.context.setLoaded(true);

      this.initScroll();
    });
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
    //localStorage.setItem(this.getPageKey(), window.scrollY || window.pageYOffset);
  }

  componentWillUnmount() {
    super.componentWillUnmount();
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }

  handleBeforeUnload = () => {
    this.setScrollPosition();
  };
}