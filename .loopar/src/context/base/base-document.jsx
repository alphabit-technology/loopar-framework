import loopar from "loopar";
import {DocumentProvider} from "@context/@/document-context";
import React from "react";
import { useWorkspace } from "@workspace/workspace-provider";

export default class BaseDocument extends React.Component {
  dontHaveContainer = true;
  customActions = {};
  __REFS__ = {};
  __META_DEFS__ = {};
  hasBreadcrumb = true;
  static contextType = useWorkspace;

  constructor(props) {
    super(props);
  
    this.state = {
      ...this.state,
      meta: props.meta,
    };
  }

  get __hasSidebar__() {
    return typeof this.props.hasSidebar !== "undefined" ? this.props.hasSidebar : this.hasSidebar;
  }

  get __hasHeader__() {
    return typeof this.props.hasHeader !== "undefined" ? this.props.hasHeader : this.hasHeader;
  }

  get __hasFooter__() {
    return typeof this.props.hasFooter !== "undefined" ? this.props.hasFooter : this.hasFooter;
  }

  get __hasSearchForm__() {
    return typeof this.props.hasSearchForm !== "undefined" ? this.props.hasSearchForm : this.hasSearchForm;
  }

  get __hasBreadcrumb__() {
    return typeof this.props.hasBreadcrumb !== "undefined" ? this.props.hasBreadcrumb : this.hasBreadcrumb;
  }

  render(content) {
    return (
      <DocumentProvider
        docRef={this}
        formValues={this.getFormValues ? this.getFormValues() : {}}
        name={this.state.meta?.__DOCUMENT_NAME__}
        spacing={this.state.meta?.__SPACING__}
      >
        {content}
      </DocumentProvider>
    );
  }

  get(name){
    return this.__REFS__[name];
  }

  get meta() {
    return this.state.meta || this.props.meta || {};
  }

  setFieldDf(fieldName, attr, value) {
    this.__META_DEFS__[fieldName] = {...this.__META_DEFS__[fieldName] || {}, ...{data: {[attr]: value}}};

    this.setState({});
  }

  on(fieldName, event, callback) {
    this.__META_DEFS__[fieldName] = {...this.__META_DEFS__[fieldName], ["on" + loopar.utils.Capitalize(event)]: callback};
    this.setState({});
  }

  get __ENTITY__() {
    return this.meta.__ENTITY__;
  }

  get __STRUCTURE__() {
    return this.__ENTITY__.STRUCTURE || JSON.parse(this.__ENTITY__.doc_structure || "{}");
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

  get __WRITABLE_FIELDS__() {
    return this.__FIELDS__.filter(field => field.def?.isWritable);
  }

  get __READONLY_FIELDS__() {
    return this.__FIELDS__.filter(field => field.data.readonly);
  }


  __FIELD__(fieldName) {
    return this.__FIELDS__.find(field => field.data.name === fieldName);
  }

  setCustomAction(name, action) {
    this.customActions[name] = action;
    this.setState({});
  }

  setCustomActions() { }

  initActions() {
    this.__WRITABLE_FIELDS__.forEach(field => {
      this.on(field.data.name, "changed", (e) => {
        //console.log(["context", this.meta])
        //this.state.meta.__DOCUMENT__ = e.target.value;
        //this.hydrate();;
        this.setState({})
        // const meta = { ...this.state.meta };
        // meta.__DOCUMENT__[field.data.name] = e.target.value;
        // this.setState({meta: meta})
      });
    });

  }

  componentDidMount() {
    this.initScroll();
    this.initActions();
  }

  // componentDidUpdate(prevProps) {
  //   // Compara las props anteriores con las actuales
  //   if (prevProps.meta !== this.props.meta) {
  //     // Actualiza el estado si las props han cambiado
  //     this.setState({ meta: this.props.meta });
  //   }
  // }

  getPageKey() {
    return this.meta.key;
  }

  getCurrentScrollPosition() {
    return loopar.cookie.get(this.getPageKey()) || window.scrollY || window.pageYOffset;
  }

  initScroll() {
    const scrollPosition = loopar.cookie.get(this.getPageKey()) || 0;

    window.scrollTo(0, scrollPosition);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  setScrollPosition() {
    loopar.cookie.set(this.getPageKey(), window.scrollY || window.pageYOffset);
    //localStorage.setItem(this.getPageKey(), window.scrollY || window.pageYOffset);
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }

  handleBeforeUnload = (e) => {
    this.setScrollPosition();
  };
}