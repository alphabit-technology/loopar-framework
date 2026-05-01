import loopar from "loopar";
import {DocumentProvider} from "@context/@/document-context";
import React from "react";

export default class BaseDocument extends React.Component {
  dontHaveContainer = true;
  customActions = {};
  __REFS__ = {};
  __META_DEFS__ = {};
  hasBreadcrumb = true;

  /**
   * Internal caches. Invalidated when the underlying source changes
   * (`Document.STRUCTURE` or `Document.Entity.doc_structure`) — see `__STRUCTURE__`.
   */
  _cachedStructureSrc = undefined;
  _cachedStructure = undefined;
  _cachedFields = undefined;
  _cachedFieldByName = undefined;

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

  render(content, slots) {
    const Document = this.state.Document;
    return (
      <DocumentProvider
        docRef={this}
        formValues={this.getFormValues ? this.getFormValues() : {}}
        name={Document.name}
        title={Document.meta.title}
        spacing={Document.spacing}
        Document={this.Document}
        slots={slots}
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

    // `Meta.jsx` reads `__META_DEFS__` during render, so re-render to reflect the new value.
    this.setState({});
  }

  /**
   * Registers a callback against a field event. Does NOT trigger a re-render —
   * the caller (e.g. `initActions`, `setCustomActions`) is responsible for
   * batching a single `setState` after registering all callbacks.
   */
  on(fieldName, event, callback) {
    this.__META_DEFS__[fieldName] = {...this.__META_DEFS__[fieldName], ["on" + loopar.utils.Capitalize(event)]: callback};
  }

  get __ENTITY__() {
    return this.__META__.Entity || {};
  }

  /**
   * Memoized parse + lookup of the document structure. Invalidates derived
   * caches whenever the underlying source string changes.
   */
  get __STRUCTURE__() {
    const explicit = this.Document.STRUCTURE;
    const docStructure = this.Document.Entity?.doc_structure ?? "[]";
    const src = explicit ?? docStructure;

    if (this._cachedStructureSrc === src && this._cachedStructure !== undefined) {
      return this._cachedStructure;
    }

    this._cachedStructureSrc = src;
    this._cachedStructure = explicit ?? JSON.parse(docStructure);
    // Invalidate derived caches.
    this._cachedFields = undefined;
    this._cachedFieldByName = undefined;
    return this._cachedStructure;
  }

  /** Flattened, memoized list of fields. Rebuilt only when `__STRUCTURE__` changes. */
  get __FIELDS__() {
    if (this._cachedFields !== undefined) return this._cachedFields;

    const mapFields = (fields) => {
      return fields.reduce((acc, field) => {
        acc.push({
          data: field.data,
          def: ELEMENT_DEFINITION(field.element)
        });

        if (field.elements) {
          return acc.concat(mapFields(field.elements));
        }

        return acc;
      }, []);
    }

    this._cachedFields = mapFields(this.__STRUCTURE__);
    return this._cachedFields;
  }

  get __WRITABLE_FIELDS__() {
    return this.__FIELDS__.filter(field => field.def?.isWritable);
  }

  get __READONLY_FIELDS__() {
    return this.__FIELDS__.filter(field => field.data.readonly);
  }


  /**
   * O(1) field lookup by name, backed by a memoized `Map`. Built lazily on first
   * call and invalidated together with `__FIELDS__` when `__STRUCTURE__` changes.
   */
  __FIELD__(fieldName) {
    if (this._cachedFieldByName === undefined) {
      this._cachedFieldByName = new Map();
      for (const field of this.__FIELDS__) {
        if (field.data?.name) this._cachedFieldByName.set(field.data.name, field);
      }
    }
    return this._cachedFieldByName.get(fieldName);
  }

  setCustomAction(name, action) {
    this.customActions[name] = action;
    // `app-barr.jsx` reads `customActions` during render, so a re-render is required.
    this.setState({});
  }

  setCustomActions() { }

  /**
   * Registers a "changed" handler on every writable field. Callbacks are
   * registered silently via `on()` and a single `setState` is dispatched at the
   * end so `Meta.jsx` picks up the updated handlers in one re-render.
   */
  initActions() {
    let changed = false;
    this.__WRITABLE_FIELDS__.forEach(field => {
      this.on(field.data.name, "changed", () => {
        // Per-field user changes still need an individual re-render because they
        // can affect derived values / visibility.
        this.setState({});
      });
      changed = true;
    });
    if (changed) this.setState({});
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
    if(this.props.inModal ) return;
    const scrollPosition = loopar.cookie.get(this.getPageKey()) || 0;

    window.scrollTo(0, scrollPosition);
    window.addEventListener("beforeunload", this.handleBeforeUnload);
  }

  setScrollPosition() {
    if(this.props.inModal ) return;
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
