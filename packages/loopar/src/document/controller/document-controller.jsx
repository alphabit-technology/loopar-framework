import loopar from "loopar";
import DocumentHistory from "../../components/document-history.jsx";
import { mixin } from "./mixin";

/**
 * Document controller — the framework-side "brain" of an entry point
 * (form, list, page, view...). Framework-agnostic on purpose: it only
 * expects the host to provide
 *
 *   - `props`      → the React props ({ Document, inModal, hasSidebar, ... })
 *   - `rerender()` → schedule a re-render of the host
 *
 * The same methods back two hosts:
 *   - a plain object created by `useDocumentController()` (functional views)
 *   - a `BaseDocument` class instance (legacy class views), via `mixin()`.
 *
 * Children reach the controller as `docRef` through `useDocument()`.
 */

/** Instance fields. Applied to the host once, before any method runs. */
export function initDocumentController(host) {
  Object.assign(host, {
    dontHaveContainer: true,
    hasBreadcrumb: true,
    customActions: {},
    __REFS__: {},
    __META_DEFS__: {},
    // Internal caches, invalidated by `__STRUCTURE__` when its source changes.
    _cachedStructureSrc: undefined,
    _cachedStructure: undefined,
    _cachedFields: undefined,
    _cachedFieldByName: undefined,
  });
  return host;
}

export const documentControllerMethods = {
  /* ---------------------------------------------------------------- flags */
  get __hasSidebar__() {
    // Never inside a modal mini-workspace: the InnerSidebar (and its floating
    // toggle) are `position: fixed`, so from a modal they would paint over the
    // BASE page's viewport, not the modal.
    if (this.props.inModal) return false;
    return typeof this.props.hasSidebar !== "undefined" ? this.props.hasSidebar : this.hasSidebar;
  },

  get __hasHeader__() {
    return typeof this.props.hasHeader !== "undefined" ? this.props.hasHeader : this.hasHeader;
  },

  get __hasFooter__() {
    return typeof this.props.hasFooter !== "undefined" ? this.props.hasFooter : this.hasFooter;
  },

  get __hasSearchForm__() {
    return typeof this.props.hasSearchForm !== "undefined" ? this.props.hasSearchForm : this.hasSearchForm;
  },

  get __hasBreadcrumb__() {
    return typeof this.props.hasBreadcrumb !== "undefined" ? this.props.hasBreadcrumb : this.hasBreadcrumb;
  },

  /* ------------------------------------------------------------- document */
  get Document() {
    return this.props.Document || {};
  },

  get __META__() {
    return this.props.__META__ || {};
  },

  get __IS_NEW__() {
    return this.Document.isNew;
  },

  get __DOCUMENT_NAME__() {
    return this.__META__.__DOCUMENT_NAME__;
  },

  get __ENTITY__() {
    return this.__META__.Entity || {};
  },

  get(name) {
    return this.__REFS__[name];
  },

  /* ------------------------------------------------------------ structure */
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
    this._cachedFields = undefined;
    this._cachedFieldByName = undefined;
    return this._cachedStructure;
  },

  /** Flattened, memoized list of fields. Rebuilt only when `__STRUCTURE__` changes. */
  get __FIELDS__() {
    if (this._cachedFields !== undefined) return this._cachedFields;

    const mapFields = (fields) => fields.reduce((acc, field) => {
      acc.push({ data: field.data, def: ELEMENT_DEFINITION(field.element) });
      if (field.elements) return acc.concat(mapFields(field.elements));
      return acc;
    }, []);

    this._cachedFields = mapFields(this.__STRUCTURE__);
    return this._cachedFields;
  },

  get __WRITABLE_FIELDS__() {
    return this.__FIELDS__.filter(field => field.def?.isWritable);
  },

  get __READONLY_FIELDS__() {
    return this.__FIELDS__.filter(field => field.data.readonly);
  },

  /** O(1) field lookup by name, backed by a memoized `Map`. */
  __FIELD__(fieldName) {
    if (this._cachedFieldByName === undefined) {
      this._cachedFieldByName = new Map();
      for (const field of this.__FIELDS__) {
        if (field.data?.name) this._cachedFieldByName.set(field.data.name, field);
      }
    }
    return this._cachedFieldByName.get(fieldName);
  },

  /* ----------------------------------------------------- field meta/events */
  setFieldDf(fieldName, attr, value) {
    this.__META_DEFS__[fieldName] = { ...this.__META_DEFS__[fieldName] || {}, ...{ data: { [attr]: value } } };
    // `Meta.jsx` reads `__META_DEFS__` during render, so re-render to reflect the new value.
    this.rerender();
  },

  /**
   * Registers a callback against a field event. Does NOT trigger a re-render —
   * the caller (e.g. `initActions`, `setCustomActions`) is responsible for
   * batching a single `rerender()` after registering all callbacks.
   */
  on(fieldName, event, callback) {
    this.__META_DEFS__[fieldName] = { ...this.__META_DEFS__[fieldName], ["on" + loopar.utils.Capitalize(event)]: callback };
  },

  /**
   * Registers a "changed" handler on every writable field, then dispatches a
   * single re-render so `Meta.jsx` picks up the handlers in one pass.
   */
  initActions() {
    let changed = false;
    this.__WRITABLE_FIELDS__.forEach(field => {
      this.on(field.data.name, "changed", () => {
        // Per-field user changes still need an individual re-render because they
        // can affect derived values / visibility.
        this.rerender();
      });
      changed = true;
    });
    if (changed) this.rerender();
  },

  /* -------------------------------------------------------------- actions */
  setCustomAction(name, action) {
    this.customActions[name] = action;
    // `app-barr.jsx` reads `customActions` during render, so a re-render is required.
    this.rerender();
  },

  /** Extension point: register custom actions (AppBar) after mount. */
  setCustomActions() { },

  setterAndGetter(name, value) {
    if (typeof value === "undefined") return this[name];
    this[name] = value;
  },

  /* -------------------------------------------------------------- history */
  getDocumentHistory(isPage) {
    const entity = this.Document?.Entity || {};
    const enableHistory = !!entity.enable_history;
    const enableComments = !!entity.enable_comments;
    if (!enableHistory && !enableComments) return null;

    const documentType = entity.name;
    const documentName = isPage ? documentType : (this.__DOCUMENT_NAME__ || this.Document?.name);

    if (!documentType && !documentName) return null;

    return (
      <section className="mt-10 pt-6 border-t border-border w-full max-w-3xl">
        <DocumentHistory
          document={documentType}
          documentName={documentName}
          enableHistory={enableHistory}
          enableComments={enableComments}
          requireLogin={!!entity.require_login_to_comment}
          canModerate
        />
      </section>
    );
  },

  /* --------------------------------------------------------------- scroll */
  getPageKey() {
    return this.Document.key;
  },

  getCurrentScrollPosition() {
    return loopar.cookie.get(this.getPageKey()) || window.scrollY || window.pageYOffset;
  },

  initScroll() {
    if (this.props.inModal) return;
    const scrollPosition = loopar.cookie.get(this.getPageKey()) || 0;

    window.scrollTo(0, scrollPosition);
    if (!this._handleBeforeUnload) this._handleBeforeUnload = () => this.setScrollPosition();
    window.addEventListener("beforeunload", this._handleBeforeUnload);
  },

  setScrollPosition() {
    if (this.props.inModal) return;
    loopar.cookie.set(this.getPageKey(), window.scrollY || window.pageYOffset);
  },

  /* ------------------------------------------------------------ lifecycle */
  /** Called once after the host is mounted in the DOM. */
  mount() {
    this.initScroll();
    this.initActions();
  },

  /** Called once before the host is removed from the DOM. */
  unmount() {
    if (this._handleBeforeUnload) window.removeEventListener("beforeunload", this._handleBeforeUnload);
    this.setScrollPosition();
  },
};

/**
 * Builds a standalone controller (functional hosts). `env` must provide
 * `props` (a getter is fine) and `rerender`.
 */
export function createDocumentController(env, overrides) {
  const host = {};
  Object.defineProperty(host, "props", { get: () => env.props, configurable: true });
  host.rerender = env.rerender;
  initDocumentController(host);
  mixin(host, documentControllerMethods);
  return mixin(host, overrides);
}
