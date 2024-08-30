import loopar from "$loopar";
import {DocumentContext} from "@context/@/document-context";
import React from "react";

export default class BaseDocument extends React.Component {
  dontHaveContainer = true;
  customActions = {};
  __REFS__ = {};
  __META_DEFS__ = {};

  constructor(props) {
    super(props);

    this.state = {
      meta: props.meta
    };
  }

  render(content) {
    return (
      <DocumentContext.Provider value={{ docRef: this, formValues: this.getFormValues ? this.getFormValues() : {} }}>
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
    return JSON.parse(this.__ENTITY__.doc_structure || "{}");
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
      //this.get(field.data.name)?.handleChange()
      this.on(field.data.name, "changed", (value) => {
        this.setState({});
      });
    });

  }

  componentDidMount() {
    this.initScroll();
    this.initActions();
  }

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