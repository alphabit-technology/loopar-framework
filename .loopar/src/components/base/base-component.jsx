import React from "react";
import loopar from "$loopar";
import elementManage, { styleToObject } from "$tools/element-manage";
import MetaComponent from "@meta-component";

export default class BaseComponent extends React.Component {
  states = [];
  elements_list = [];
  attrs = {};
  attrsList = [];

  get $state() {
    return (this.states.length > 0 ? this.states[this.states.length - 1] : this.state) || {};
  }

  constructor(props) {
    super(props);

    this.state = {
      ...this.state,
      attrs: {},
      visible: true,
    };
  }

  mergeAttributes(target, ...sources) {
    function isObject(item) {
      return (item && typeof item === 'object' && !Array.isArray(item));
    }

    function mergeDeep(target, ...sources) {
      if (!sources.length) return target;
      const source = sources.shift();

      if (isObject(target) && isObject(source)) {
        for (const key in source) {
          if (isObject(source[key])) {
            if (!target[key]) {
              Object.assign(target, { [key]: {} });
            } else {
              target[key] = Object.assign({}, target[key])
            }
            mergeDeep(target[key], source[key]);
          } else {
            Object.assign(target, { [key]: source[key] });
          }
        }
      }

      return mergeDeep(target, ...sources);
    }

    return mergeDeep(target, ...sources);
  }

  tagDontHaveChild(tag) {
    /**List Elements that don't have children */
    const singleTags = "input,textarea,img,switch,checkbox,hr,br,checkbox,script,link,base,area,basefont,frame,embed,source,track,wbr,image".split(",");

    return singleTags.includes(tag);
  }

  render(Content = null) {
    const props = Object.assign({}, this.props);
    const data = this.data || {};
    const children = Content || this.props.children || [];

    const tag = this.tagName || this.props.tagName || "div";
    const className = this.dontHaveContainer ? "" : this.getClassName;
    if (className && className.length > 0) props.className = className + (this.extraClassName ? " " + this.extraClassName : "");

    const animations = {}
    if (data.animation && !props.designer && !this.dontHaveContainer) {
      this.animation = loopar.getAnimation(data.animation);
      animations["data-aos"] = this.animation;

      if (data.animation_delay) {
        animations["data-aos-delay"] = data.animation_delay;
      }

      if (data.animation_duration && data.animation_duration > 0) {
        animations["data-aos-duration"] = data.animation_duration;
      } else {
        animations["data-aos-duration"] = 2000;
      }
    }

    const renderProps = {
      ...Object.keys(props).reduce((acc, key) => {
        if (key !== "style" && !["object"].includes(typeof props[key]) && !["element", "tagName", "key"].includes(key)) {
          acc[key] = props[key];
        }
        return acc;
      }, {}),
      ...{ style: this.getStyle },
      ...this.state.attrs,
      ...animations,
      ...this.attrs,
      ...{
        ...(data.id ? { id: data.id } : {}),
        ...(data.name ? { name: data.name } : {})
      }
    }

    if (!this.tagName && Content && Content.$$typeof && Content.$$typeof.toString() === "Symbol(react.element)") {
      return this.tagDontHaveChild(tag) ?
        React.createElement(Content.type || "div", { ...renderProps, ...Content.props }) :
        React.createElement(Content.type || "div", { ...renderProps, ...Content.props }, Content.props.children)
    } else {
      return this.tagDontHaveChild(tag) ?
        React.createElement(tag === "image" ? "img" : tag, renderProps) :
        React.createElement(tag === "image" ? "img" : tag, renderProps, [
          children,
          !this.blockComponent && this.elements
        ]);
    }
  }

  get getStyle() {
    const selfStyle = this.style || {};
    const dataStyle = styleToObject(this.data.style) || {};

    return { ...selfStyle, ...dataStyle, ...this.props.style || {} };
  }

  get element() {
    return this.props.element;
  }

  get elements() {
    return <MetaComponent elements={this.elementsDict || []} parent={this} />
  }

  get elementsDict() {
    return this.state.elements || this.props.elements || [];
  }

  getElement(el, props = {}) {
    Object.assign(el, props)
    return <MetaComponent elements={[el]} parent={this} />
  }

  addChild(child, merge = false) {
    this.setState({ children: child }, null, merge);
  }

  text(text) {
    this.setState({ children: text }, null, false);
  }

  on(event, callback) {
    this.attrsList["on" + loopar.utils.Capitalize(event)] ??= [];

    const events = this.attrsList["on" + loopar.utils.Capitalize(event)];

    const check = events.some(e => {
      return e.toString() === callback.toString();
    });

    if (!check) {
      events.push(callback);
    }

    this.attrs["on" + loopar.utils.Capitalize(event)] = (e) => {
      events.forEach(callback => {
        callback(e);
      });
    }
  }

  show() {
    this.setState({ visible: true });
    //this.removeClass("no-display");
  }

  hide() {
    this.setState({ visible: false });
    //this.addClass("no-display");
  }

  get getClassName() {
    const selfClassName = this.className || '';
    const propsClassName = this.props.className || '';
    const stateClassName = (this.$state || {}).className || '';
    const dataClassName = this.dontHaveContainer ? null : ((this.props?.data || {}).class || null);
    this.lastSettedClass ??= (dataClassName || "");

    const classes = `${selfClassName} ${stateClassName} ${propsClassName}`.split(' ');

    /*if(props && props.data && props.data.aos && !props.designer){
       classes.push("aos-init os-animate");
    }*/

    return Array.from(
      new Set(
        classes.filter(c => c && c.length > 0 && !this.lastSettedClass.split(" ").includes(c) && ["undefined", "null"].indexOf(c) === -1)
      )
    ).join(' ') + (dataClassName ? " " + dataClassName : "");
  }

  hasClass(className) {
    return this.getClassName.includes(className);
  }

  toggleClass(className) {
    if (this.getClassName.includes(className)) {
      this.removeClass(className);
    } else {
      this.addClass(className);
    }
    return this;
  }

  replaceClass(className, newClassName) {
    const newClass = this.getClassName.replace(className, newClassName);
    this.setState({ className: newClass });
    return this;
  }

  attr(name, value) {
    if (value === undefined) {
      return this.props[name] || this.$state.attrs[name];
    } else {
      setTimeout(() => {
        this.setAttrs({ [name]: value });
      }, 0);
    }
  }

  setState(state, callback, merge = false) {
    const lastState = this.state || {};
    const newState = merge ? this.mergeAttributes(lastState, state) : state;

    super.setState(newState, typeof callback === "function" ? callback : undefined);
  }

  setAttrs(attr, value) {
    const currentAttrs = this.state.attrs || {};

    if (typeof attr === "object") {
      this.setState({ attrs: { ...currentAttrs, ...attr } }, null, true);
    } else {
      this.setState({ attrs: { ...currentAttrs, [attr]: value } }, null, true);
    }
  }

  addClass(className, render = true) {
    if (this.hasClass(className)) return this;
    const whereIsClass = (this.state || {}).className ? "state" : "props";

    const currentClass = (this.getClassName + " " + className).split(" ").filter(c => c !== "" && c.length > 0)//.join(" ");
    const classNamelist = Array.from(new Set(currentClass)).join(" ");

    if (whereIsClass === "props") {
      this.className = classNamelist;
      render && this.setState({});
    } else {
      render && this.setState({ className: classNamelist });
    }

    return this;
  }

  removeClass(className, render = true) {
    if (!this.hasClass(className)) return this;
    const currentClass = this.getClassName.split(" ");
    const whereIsClass = (this.$state || {}).className ? "state" : "props";

    className.split(" ").map(c => {
      const index = currentClass.indexOf(c);
      index > -1 && currentClass.splice(index, 1);
    });

    if (whereIsClass === "props") {
      this.className = currentClass.join(" ");
      render && this.setState({});
    } else {
      render && this.setState({ className: currentClass.join(" ") });
    }

    return this;
  }

  innerHtml(content) {
    return {
      dangerouslySetInnerHTML: { __html: content }
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    this.prevProps = prevProps;
    this.onUpdate && this.onUpdate(prevProps, prevState, snapshot);
  }

  componentDidMount() {
    if (this.props.Component) {
      this.Component = this.props.Component;
    }

    this.onMake && this.onMake();
    this.onUpdate && this.onUpdate();
    this.onMount && this.onMount();
  }

  componentWillUnmount() {
    this.onRemove && this.onRemove();
  }

  makeEvents() { }

  /*get meta() {
     const meta = this.state.meta || this.props || {};
     return meta || {};
  }*/

  get data() {
    return this.state.data || this.props.data || {};
  }

  get node() {
    return this._reactInternals?.child?.stateNode;
  }

  focus() {
    this.node?.focus();
  }

  css(prop, value = null) {
    if (typeof prop === "object") {
      this.setState({ style: prop });
    } else {
      const css = this.state.style || {};
      css[prop] = value;
      this.setState({ style: css });
    }
    return this;
  }

  onUpdate() { }

  get app() {
    return (this.parentComponent || this).options.app;
  }

  setElements(elements, callback, merge = true) {
    const newElements = (merge ? [...this.elementsDict, ...elements] : elements);

    function removeDuplicates(array) {
      const seen = new Set();
      return array.filter(obj => {
        const value = obj.data.key;
        if (!seen.has(value)) {
          seen.add(value);
          return true;
        }
        return false;
      });
    }

    loopar.Designer?.updateElements(this, removeDuplicates(newElements), null, callback);
  }

  addElement(element = null, callback) {
    if (!element) return;

    this.setElements([...this.elementsDict, [element]], callback);
  }

  /**Parent component is the component that contains the current element, only for Block Elements ej: Card*/
  /*get parentComponent() {
     return this.options.component;
  }

  set parentComponent(component) {
     this.options.component = component;
  }*/

  /**Parent element is the element that contains the current element for all Elements*/
  remove() {
    if (this.parentElement) {
      const currentElements = this.parentElement.elementsDict;
      currentElements.findIndex((element) => {
        if (element.data.key === this.data.key) {
          currentElements.splice(currentElements.indexOf(element), 1);
          return true;
        }
      });

      this.parentElement.setElements(currentElements);
    }

    setTimeout(() => {
      //trigger && this.onRemove && this.onRemove();
      loopar.documentForm && loopar.documentForm.makeDocStructure();
    }, 0);
  }

  get identifier() {
    const { key, id, name } = this.data;
    return key ?? id ?? name ?? elementManage.getUniqueKey();
  }
}