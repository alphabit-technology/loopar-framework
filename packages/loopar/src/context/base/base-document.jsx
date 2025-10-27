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
      Document: props.Document,
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
    const Document = this.state.Document;
    return (
      <DocumentProvider
        docRef={this}
        formValues={this.getFormValues ? this.getFormValues() : {}}
        name={Document.name}
        title={Document.meta.title}
        spacing={Document.spacing}
        Document={this.Document}
      >
        <>
          <title>{Document.meta.title}</title>
          {content}
        </>
      </DocumentProvider>
    );
  }

  get(name){
    return this.__REFS__[name];
  }

  /* get meta() {
    return this.state.meta || this.props.meta || {};
  } */

  get Document() {
    return this.props.Document || {};
  }

  get __META__(){
    return this.state.__META__ || this.props.__META__ || {};
  }

  get __IS_NEW__() {
    return this.Document.isNew;
  }

  get __DOCUMENT_NAME__() {
    return this.__META__.__DOCUMENT_NAME__;
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
    return this.__META__.Entity || {};
  }

  get __STRUCTURE__() {
    return this.Document.STRUCTURE || JSON.parse(this.Document.Entity.doc_structure || "[]");
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
        this.setState({})
      });
    });
  }

  componentDidMount() {
    this.initScroll();
    this.initActions();
  }

  setterAndGetter(name, value) {
    if (typeof value === "undefined") {
      return this[name];
    }

    this[name] = value;
  }

  getPageKey() {
    return this.Document.key;
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
  }

  componentWillUnmount() {
    window.removeEventListener("beforeunload", this.handleBeforeUnload);
    this.setScrollPosition();
  }

  handleBeforeUnload = (e) => {
    this.setScrollPosition();
  };
}