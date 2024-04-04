var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
var __accessCheck = (obj, member, msg) => {
  if (!member.has(obj))
    throw TypeError("Cannot " + msg);
};
var __privateGet = (obj, member, getter) => {
  __accessCheck(obj, member, "read from private field");
  return getter ? getter.call(obj) : member.get(obj);
};
var __privateAdd = (obj, member, value) => {
  if (member.has(obj))
    throw TypeError("Cannot add the same private member more than once");
  member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
};
var __privateSet = (obj, member, value, setter) => {
  __accessCheck(obj, member, "write to private field");
  setter ? setter.call(obj, value) : member.set(obj, value);
  return value;
};
var _elementToDrag, _elementToCreate;
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import React__default, { createContext, useContext, useState, useRef } from "react";
import { e as elementsDict, C as Components, c as cn, l as loopar } from "../entry-server.js";
import { e as elementManage, s as styleToObject } from "./element-manage-OWCB4Xyr.js";
import { E as ElementTitle } from "./element-title-oSDJ5F20.js";
class DragAndDrop {
  constructor(options) {
    __privateAdd(this, _elementToDrag, null);
    __privateAdd(this, _elementToCreate, null);
  }
  set elementToDrag(element) {
    __privateSet(this, _elementToDrag, element);
  }
  get elementToDrag() {
    return __privateGet(this, _elementToDrag);
  }
  set elementToCreate(element) {
    __privateSet(this, _elementToCreate, element);
  }
  get elementToCreate() {
    return __privateGet(this, _elementToCreate);
  }
  dragstart(element, event) {
  }
  /*drop(element, event) {
         event.preventDefault();
         element.removeClass("over-drag");
  
         if (this.elementToCreate) {
             this.elementToCreate.is_element = true;
             element.set_dropped_element(this.elementToCreate);
         } else {
             if (this.elementToDrag) {
                 if (this.elementToDrag.parentOf(element) || element === this.elementToDrag) {
  
                 } else {
                     element.set_dropped_element(this.elementToDrag);
                 }
             }
         }
     }*/
  allowDrop(ev) {
    ev.preventDefault();
  }
}
_elementToDrag = new WeakMap();
_elementToCreate = new WeakMap();
const DragAndDropUtils = new DragAndDrop();
const DesignerContext = createContext({
  designerMode: false,
  designerRef: null,
  toggleDesign: () => {
  },
  design: false
});
const useDesigner = () => useContext(DesignerContext);
createContext();
const DocumentContext = createContext({
  mode: "preview",
  // "preview" | "design" | "editor"
  toggleMode: () => {
  },
  editElement: null,
  setEditElement: () => {
  }
});
const useDocument = () => useContext(DocumentContext);
const designElementProps = (el) => {
  var _a;
  if (!el.data) {
    const names = elementManage.elementName(props.element);
    el.data = {
      name: names.name,
      label: names.label,
      id: names.id,
      key: names.id
    };
  }
  (_a = el.data).key ?? (_a.key = elementManage.getUniqueKey());
  const newProps = {
    ...{
      ...el,
      key: "design-element" + el.data.key,
      //readOnly: selfProps.readOnly,
      hasTitle: true,
      dragabble: true
    }
  };
  return newProps;
};
const elementProps = ({ elDict, parent = {}, isDesigner }) => {
  if (isDesigner)
    return designElementProps(elDict);
  elDict.data ?? (elDict.data = {});
  const data = elDict.data;
  return {
    element: elDict.element,
    ...{
      key: elDict.key || "element" + data.key
    },
    ...elDict
  };
};
const DesignElement = ({ parent, element, Comp, def }) => {
  const [hover, setHover] = useState(false);
  const document = useDocument();
  const designer = useDesigner();
  const dragginElement = useRef(null);
  const isDroppable = Comp.prototype.droppable || element.fieldDesigner;
  let className = Comp.prototype.designerClasses || "";
  if (document.mode !== "preview") {
    if (isDroppable) {
      className += "rounded-md border border-gray-400 shadow bg-gray-200/80 dark:bg-slate-800/70 p-2 pb-4 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-slate-800 dark:hover:border-gray-600 dark:hover:shadow-lg";
    } else {
      className += "bg-gray-300 p-2 mb-4 dark:bg-gray-900 border border-gray-400 dark:border-gray-600 rounded-md";
    }
  }
  const handleMouseOver = (e) => {
    e.stopPropagation();
    setHover(true);
  };
  const handleEditElement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleEditElement(dragginElement.current);
  };
  const handleDeleteElement = (e) => {
    e.preventDefault();
    e.stopPropagation();
    designer.handleDeleteElement(dragginElement.current);
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("relative min-h-10 h-auto", className),
      draggable: !element.fieldDesigner,
      onDragStartCapture: (e) => {
        DragAndDropUtils.elementToDrag = dragginElement.current;
      },
      onDragEnter: (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (DragAndDropUtils.lastElementTargetSibling) {
          if (DragAndDropUtils.currentElementTargetSibling.identifier !== dragginElement.current.identifier) {
            DragAndDropUtils.lastElementTargetSibling = DragAndDropUtils.currentElementTargetSibling;
          }
        } else {
          DragAndDropUtils.lastElementTargetSibling = dragginElement.current;
        }
        DragAndDropUtils.currentElementTargetSibling = dragginElement.current;
      },
      onMouseOver: handleMouseOver,
      onMouseOut: () => setHover(false),
      children: [
        document.mode !== "preview" && /* @__PURE__ */ jsx(
          ElementTitle,
          {
            element,
            active: hover,
            handleEditElement,
            handleDeleteElement,
            style: { top: 0 }
          }
        ),
        /* @__PURE__ */ jsx(
          Comp,
          {
            ...element,
            ref: (self) => {
              if (self) {
                self.parentComponent = parent;
                dragginElement.current = self;
              }
            }
          }
        )
      ]
    }
  );
};
function getComponents({ elements = [], parent } = {}) {
  var _a;
  const components = [];
  const designer = useDesigner();
  const isDesigner = designer.designerMode;
  if (elements && Array.isArray(elements)) {
    for (const el of elements) {
      const def = elementsDict[el.element].def;
      el.def = def;
      const Comp = Components[def.element];
      const props2 = elementProps({ elDict: el, isDesigner, parent });
      if (Comp) {
        Comp.default && (isDesigner || !((_a = props2.data) == null ? void 0 : _a.hidden)) && components.push(
          /* @__PURE__ */ jsx(Fragment, { children: isDesigner && props2 ? /* @__PURE__ */ jsx(DesignElement, { Comp: Comp.default, element: props2, parent, def }) : /* @__PURE__ */ jsx(Comp.default, { ...props2 }) })
        );
      }
    }
  }
  return components;
}
const DynamicComponent = ({ Wrapper, elements, parent, ...props2 }) => {
  const [Components2, setComponents] = useState(null);
  !Components2 && setComponents(getComponents({ elements, parent }));
  if (Components2) {
    return Wrapper ? /* @__PURE__ */ jsxs(Wrapper, { children: [
      ...Components2
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      ...Components2
    ] });
  }
};
const DynamicComponent$1 = DynamicComponent;
class BaseComponent extends React__default.Component {
  constructor(props2) {
    super(props2);
    __publicField(this, "states", []);
    __publicField(this, "elements_list", []);
    __publicField(this, "attrs", {});
    __publicField(this, "attrsList", []);
    this.state = {
      ...this.state,
      attrs: {}
    };
  }
  get $state() {
    return (this.states.length > 0 ? this.states[this.states.length - 1] : this.state) || {};
  }
  mergeAttributes(target, ...sources) {
    function isObject(item) {
      return item && typeof item === "object" && !Array.isArray(item);
    }
    function mergeDeep(target2, ...sources2) {
      if (!sources2.length)
        return target2;
      const source = sources2.shift();
      if (isObject(target2) && isObject(source)) {
        for (const key in source) {
          if (isObject(source[key])) {
            if (!target2[key]) {
              Object.assign(target2, { [key]: {} });
            } else {
              target2[key] = Object.assign({}, target2[key]);
            }
            mergeDeep(target2[key], source[key]);
          } else {
            Object.assign(target2, { [key]: source[key] });
          }
        }
      }
      return mergeDeep(target2, ...sources2);
    }
    return mergeDeep(target, ...sources);
  }
  tagDontHaveChild(tag) {
    const singleTags = "input,textarea,img,switch,checkbox,hr,br,checkbox,script,link,base,area,basefont,frame,embed,source,track,wbr,image".split(",");
    return singleTags.includes(tag);
  }
  render(Content = null) {
    var _a;
    const props2 = Object.assign({}, this.props);
    const data = this.data || {};
    const children = Content || this.props.children || [];
    const tag = this.tagName || this.props.tagName || "div";
    const className = this.dontHaveContainer ? "" : this.getClassName;
    if (className && className.length > 0)
      props2.className = className + (this.extraClassName ? " " + this.extraClassName : "");
    const animations = {};
    if (data.animation && !props2.designer && !this.dontHaveContainer) {
      this.animation = loopar.getAnimation(data.animation);
      animations["data-aos"] = this.animation;
      if (data.animation_delay) {
        animations["data-aos-delay"] = data.animation_delay;
      }
      if (data.animation_duration && data.animation_duration > 0) {
        animations["data-aos-duration"] = data.animation_duration;
      } else {
        animations["data-aos-duration"] = 2e3;
      }
    }
    const action = (_a = props2 == null ? void 0 : props2.data) == null ? void 0 : _a.action;
    const callAction = {};
    if (action) {
      if (props2.docRef && typeof props2.docRef[action] == "function") {
        callAction.onClick = () => props2.docRef[action]();
      } else {
        callAction.onClick = (e) => {
          if (props2.onClick) {
            props2.onClick(e);
          }
          if (props2.navigate) {
            loopar.navigate(props2.navigate);
          }
          loopar.navigate(action);
        };
      }
    }
    const renderProps = {
      ...Object.keys(props2).reduce((acc, key) => {
        if (key !== "style" && !["object"].includes(typeof props2[key]) && !["element", "tagName", "key"].includes(key)) {
          acc[key] = props2[key];
        }
        return acc;
      }, {}),
      ...{ style: this.getStyle },
      ...this.state.attrs,
      ...callAction,
      ...animations,
      ...this.attrs,
      ...{
        ...data.id ? { id: data.id } : {},
        ...data.name ? { name: data.name } : {}
      }
    };
    if (this.dontHaveContainer && Content && Content.$$typeof && Content.$$typeof.toString() === "Symbol(react.element)") {
      return this.tagDontHaveChild(tag) ? React__default.createElement(Content.type || "div", { ...renderProps, ...Content.props }) : React__default.createElement(Content.type || "div", { ...renderProps, ...Content.props }, Content.props.children);
    } else {
      return this.tagDontHaveChild(tag) ? React__default.createElement(tag === "image" ? "img" : tag, renderProps) : React__default.createElement(tag === "image" ? "img" : tag, renderProps, [
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
    return /* @__PURE__ */ jsx(DynamicComponent$1, { elements: this.elementsDict || [], parent: this });
  }
  get elementsDict() {
    return this.state.elements || this.props.elements || [];
  }
  getElement(el, props2 = {}) {
    Object.assign(el, props2);
    return /* @__PURE__ */ jsx(DynamicComponent$1, { elements: [el], parent: this });
  }
  addChild(child, merge = false) {
    this.setState({ children: child }, null, merge);
  }
  text(text) {
    this.setState({ children: text }, null, false);
  }
  on(event, callback) {
    var _a, _b;
    (_a = this.attrsList)[_b = "on" + loopar.utils.Capitalize(event)] ?? (_a[_b] = []);
    const events = this.attrsList["on" + loopar.utils.Capitalize(event)];
    const check = events.some((e) => {
      return e.toString() === callback.toString();
    });
    if (!check) {
      events.push(callback);
    }
    this.attrs["on" + loopar.utils.Capitalize(event)] = (e) => {
      events.forEach((callback2) => {
        callback2(e);
      });
    };
  }
  show() {
    this.removeClass("no-display");
  }
  hide() {
    this.addClass("no-display");
  }
  get getClassName() {
    var _a;
    const selfClassName = this.className || "";
    const propsClassName = this.props.className || "";
    const stateClassName = (this.$state || {}).className || "";
    const dataClassName = this.dontHaveContainer ? null : (((_a = this.props) == null ? void 0 : _a.data) || {}).class || null;
    this.lastSettedClass ?? (this.lastSettedClass = dataClassName || "");
    const classes = `${selfClassName} ${stateClassName} ${propsClassName}`.split(" ");
    return Array.from(
      new Set(
        classes.filter((c) => c && c.length > 0 && !this.lastSettedClass.split(" ").includes(c) && ["undefined", "null"].indexOf(c) === -1)
      )
    ).join(" ") + (dataClassName ? " " + dataClassName : "");
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
    if (value === void 0) {
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
    super.setState(newState, typeof callback === "function" ? callback : void 0);
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
    if (this.hasClass(className))
      return this;
    const whereIsClass = (this.state || {}).className ? "state" : "props";
    const currentClass = (this.getClassName + " " + className).split(" ").filter((c) => c !== "" && c.length > 0);
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
    if (!this.hasClass(className))
      return this;
    const currentClass = this.getClassName.split(" ");
    const whereIsClass = (this.$state || {}).className ? "state" : "props";
    className.split(" ").map((c) => {
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
    };
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
  makeEvents() {
  }
  /*get meta() {
     const meta = this.state.meta || this.props || {};
     return meta || {};
  }*/
  get data() {
    return this.state.data || this.props.data || {};
  }
  get node() {
    var _a, _b;
    return (_b = (_a = this._reactInternals) == null ? void 0 : _a.child) == null ? void 0 : _b.stateNode;
  }
  focus() {
    var _a;
    (_a = this.node) == null ? void 0 : _a.focus();
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
  onUpdate() {
  }
  drop(event) {
    var _a;
    event.preventDefault();
    const self = this.Component || this;
    const { elementToCreate, elementToDrag, lastElementTargetSibling } = DragAndDropUtils;
    let elements = self.elementsDict;
    let newElements = null;
    if (elementToCreate) {
      if (elementToCreate.element) {
        elements.push(elementToCreate);
        newElements = this.sortElements(elements, elementToCreate, lastElementTargetSibling, "create");
      }
    } else if (elementToDrag && elementToDrag !== self) {
      if (!elementToDrag.isParentOf(this)) {
        const element = { data: Object.assign({}, elementToDrag.data), element: elementToDrag.element, elements: elementToDrag.elementsDict };
        if (elementToDrag.parentComponent !== self) {
          elements = elements.filter((e) => {
            return e.data.key !== elementToDrag.data.key;
          });
          elements.push(element);
        }
        newElements = this.sortElements(elements, element, lastElementTargetSibling);
      }
    }
    newElements && ((_a = loopar.Designer) == null ? void 0 : _a.updateElements(self, newElements, elementToDrag));
    DragAndDropUtils.elementToCreate = null;
    DragAndDropUtils.elementToDrag = null;
    DragAndDropUtils.lastElementTargetSibling = null;
  }
  sortElements(elements, movedElement, targetElement, type, direction = vertical_direction) {
    const targetInElements = elements.some((element) => {
      var _a;
      return element.data.key === ((_a = targetElement == null ? void 0 : targetElement.data) == null ? void 0 : _a.key);
    });
    if (targetInElements && targetElement.data.key !== movedElement.data.key) {
      elements = elements.filter((element) => {
        return element.data.key !== movedElement.data.key;
      });
    }
    if (movedElement && targetElement && targetElement.data.key !== movedElement.data.key && targetInElements) {
      return elements.reduce((acc, element) => {
        const data = element.data;
        if (data.key === targetElement.data.key) {
          acc = direction === UP ? [...acc, movedElement, element] : [...acc, element, movedElement];
        } else if (data.key !== movedElement.data.key) {
          acc = [...acc, element];
        }
        return acc;
      }, []);
    }
    return elements;
  }
  isParentOf(element) {
    if (!element)
      return false;
    if (element.parentComponent === this)
      return true;
    return this.isParentOf(element.parentComponent);
  }
  get app() {
    return (this.parentComponent || this).options.app;
  }
  setElements(elements, callback, merge = true) {
    var _a;
    const newElements = merge ? [...this.elementsDict, ...elements] : elements;
    function removeDuplicates(array) {
      const seen = /* @__PURE__ */ new Set();
      return array.filter((obj) => {
        const value = obj.data.key;
        if (!seen.has(value)) {
          seen.add(value);
          return true;
        }
        return false;
      });
    }
    (_a = loopar.Designer) == null ? void 0 : _a.updateElements(this, removeDuplicates(newElements), null, callback);
  }
  addElement(element = null, callback) {
    if (!element)
      return;
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
      loopar.documentForm && loopar.documentForm.makeDocStructure();
    }, 0);
  }
  get identifier() {
    const { key, id, name } = this.data;
    return key ?? id ?? name ?? elementManage.getUniqueKey();
  }
}
export {
  BaseComponent as B,
  DesignerContext as D,
  DynamicComponent$1 as a,
  useDocument as b,
  useDesigner as u
};
