import React from "react";
import loopar from "#loopar";
import DragAndDropUtils from "#tools/drag-and-drop";
import elementManage, { styleToObject } from "#tools/element-manage";
//const Element = await import("./elements.jsx");
import DynamicComponent from "#dynamic-component";

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
         attrs: {}
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
      const singleTags = "input,textarea,img,switch,checkbox,hr,br,checkbox,script,link,meta,base,area,basefont,frame,embed,source,track,wbr,image".split(",");

      return singleTags.includes(tag);
   }

   render(content = null) {
      //if(this.dontHaveContainer) return null;

      const props = Object.assign({}, this.props);
      const meta = props.meta || {};
      const data = meta.data || {};
      const children = content || this.props.children || [];

      if (props.href) {
         if (props.onClick) {
            props.href = 'javascript:void(0);';
         } else {
            if (props.href.includes("http")) {
               props.target = "_blank";
            } else if (props.href.includes("#") || props.href.includes("javascript:")) {
               props.target = "_self";
            } else if (!props.redirect) {
               props.navigate = props.href;
               if (!props.navigate.includes("javascript:void(0)")) {
                  props.onClick = () => loopar.navigate(props.navigate);
               }
               props.href = 'javascript:void(0);';
            }
         }
      }

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

      const action = props?.meta?.data?.action;

      const callAction = {};

      if (action) {
         if (props.docRef && typeof props.docRef[action] == "function") {
            callAction.onClick = () => props.docRef[action]();
         } else {
            callAction.onClick = (e) => {
               if (props.onClick) {
                  props.onClick(e);
               }

               if (props.navigate) {
                  loopar.navigate(props.navigate);
               }

               loopar.navigate(action);
            }
         }
      }

      return React.createElement(tag === "image" ? "img" : tag, {
         ...Object.keys(props).reduce((acc, key) => {
            if (key !== "style" && !["object"].includes(typeof props[key]) && !["element", "tagName", "key"].includes(key)) {
               acc[key] = props[key];
            }
            return acc;
         }, {}),
         ...{ style: this.getStyle },
         ...this.state.attrs,
         ...callAction,
         ...animations,
         ...this.attrs,
         ...{
            ...(data.id ? { id: data.id } : {}),
            ...(data.name ? { name: data.name } : {})
         }
      }, [
         children,
         !this.blockComponent && this.elements
      ]);
   }

   get getStyle() {
      const selfStyle = this.style || {};
      const dataStyle = styleToObject(this.data.style) || {};

      return { ...selfStyle, ...dataStyle, ...this.props.style || {} };
   }

   make() {
      if (this.props.Component) {
         this.Component = this.props.Component;
      }
   }

   get element() {
      return this.meta.element || this.props.element;
   }

   get elements() {
      return <DynamicComponent elements={this.elementsDict || []} props={{}} parent={this} />
      //console.log("DynamicComponent", DC)
      //return DC;  
      //return <DynamicComponent elementsDict={this.elementsDict} props={{parentRef: this}}/>
      /*return this.elementsDict.map(el => {
         return this.getElement(el);
      });*/
   }

   get elementsDict() {
      return this.meta.elements || [];
   }

   getElement(el, props = {}) {
      return <DynamicComponent elements={[el]} props={props} parent={this} />
      if (this.props.designer) return this.getDesignElement(el, props);

      el.data ??= {};
      if (el.data.hidden && !this.props.designer) return null;

      if (this.data.static_content) {
         el.data.animation = loopar.reverseAnimation(this.animation);
         //console.log("static_content", this.data.static_content, this.animation)
      }

      this.props.docRef && (props.docRef = this.props.docRef);
      this.props.docRef?.readOnly && (props.readOnly = true);

      const Props = {
         element: el.element,
         ...{
            key: 'element' + el.data.key,
            ref: self => {
               if (self) {
                  /*For inputs and other elements that have a name and have */
                  if (this.props.docRef && el.data.name) {
                     if (self.isWritable) {
                        /*For inputs elements*/
                        this.props.docRef.formFields[el.data.name] = self;
                     } else {
                        /*For other elements*/
                        this.props.docRef[el.data.name] = self;
                     }
                  }
               }
            },
            meta: {
               ...el
            },
         }, ...props
      }

      //console.log("getElement", Element)
      return <DynamicComponent {...Props} />
      /*   ...{
            key: 'element' + el.data.key,
            ref: self => {
               if (self) {
                  if (this.props.docRef && el.data.name) {
                     if (self.isWritable) {
                        this.props.docRef.formFields[el.data.name] = self;
                     } else {
                        this.props.docRef[el.data.name] = self;
                     }
                  }
               }
            },
            meta: {
               ...el
            },
         }, ...props
      });*/
   }

   getDesignElement(el, props = {}) {
      if (!el.data) {
         const names = elementManage.elementName(this.props.element);
         el.data = {
            name: names.name,
            label: names.label,
            id: names.id,
         }
      }

      el.data.key ??= elementManage.getUniqueKey();
      const selfProps = this.props;

      const newProps = {
         ...{
            key: 'element' + el.data.key,
            designer: selfProps.designer,
            designerRef: selfProps.designerRef,
            readOnly: selfProps.readOnly,
            hasTitle: true,
            dragabble: true,
            ref: self => {
               self && (self.parentComponent = this)
            },
            meta: {
               ...el,
            },
         }, ...props
      }

      return Element(el.element, newProps);
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
      this.removeClass("no-display");
   }

   hide() {
      this.addClass("no-display");
   }

   get getClassName() {
      const selfClassName = this.className || '';
      const propsClassName = this.props.className || '';
      const stateClassName = (this.$state || {}).className || '';
      const dataClassName = this.dontHaveContainer ? null : ((this.props.meta?.data || {}).class || null);
      this.lastSettedClass ??= (dataClassName || "");

      const classes = `${selfClassName} ${stateClassName} ${propsClassName}`.split(' ');

      /*if(props.meta && props.meta.data && props.meta.data.aos && !props.designer){
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
      this.make();
      this.onMake && this.onMake();
      this.onUpdate && this.onUpdate();
      this.onMount && this.onMount();
   }

   componentWillUnmount() {
      this.onRemove && this.onRemove();
   }

   makeEvents() { }

   get meta() {
      const meta = this.state.meta || this.props.meta || {};
      return meta || {};
   }

   get data() {
      const data = this.meta.data || this.state.data;
      return data || {};
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

   draggableActions() {
      this.overAnimations();

      this.setAttrs({
         draggable: true,
         onDragStart: (event) => {
            event.stopPropagation();

            this.addClass("on-drag");

            DragAndDropUtils.elementToDrag = this;
         },
         onDragEnter: (event) => {
            event.stopPropagation();

            this.applyEventDragEnd();
         }
      });

      (this.container || this).setAttrs({
         onDragEnd: (event) => {
            event.stopPropagation();
            event.stopPropagation();

            this.removeClass("on-drag");
         },
         /*onDragLeave: (event) => {
            event.stopPropagation();

            this.apply_event_drag_end();
         }*/
      });

      return this;
   }

   droppableActions() {
      this.overAnimations();
      this.setAttrs({
         droppable: true,
         onDrop: e => {
            e.stopPropagation();
            this.drop(e);
            (this.container || this).removeClass("over-drag");
         },
         onDragOver: e => {
            e.preventDefault();
            e.stopPropagation();
            (this.container || this).addClass("over-drag");
         },
         onDragLeave: e => {
            e.preventDefault();
            (this.container || this).removeClass("over-drag");
         },
         /*All droppable elements can receive before or after other elements*/
         onDragEnter: e => {
            e.preventDefault();
            e.stopPropagation();
            this.applyEventDragEnd();
         }
      });
   }

   applyEventDragEnd() {
      if (DragAndDropUtils.lastElementTargetSibling) {
         if (DragAndDropUtils.currentElementTargetSibling.identifier !== this.identifier) {

            DragAndDropUtils.lastElementTargetSibling = DragAndDropUtils.currentElementTargetSibling;
         }
      } else {
         DragAndDropUtils.lastElementTargetSibling = this;
      }

      DragAndDropUtils.currentElementTargetSibling = this;
   }

   drop(event) {
      event.preventDefault();
      const container = this.container || this;
      const self = this.Component || this;
      const { elementToCreate, elementToDrag, lastElementTargetSibling } = DragAndDropUtils;
      let elements = self.elementsDict;
      let newElements = null;

      container.removeClass("over-drag");

      if (elementToCreate) {
         if (elementToCreate.element) {
            elements.push(elementToCreate);
            newElements = this.sortElements(elements, elementToCreate, lastElementTargetSibling, "create");
         }
      } else if (elementToDrag && elementToDrag !== self) {
         if (!elementToDrag.isParentOf(this)) {
            const element = Object.assign({}, elementToDrag.meta);

            if (elementToDrag.parentComponent !== self) {
               elements = elements.filter(e => {
                  return e.data.key !== elementToDrag.meta.data.key;
               });
               elements.push(element);
            }

            newElements = this.sortElements(elements, element, lastElementTargetSibling);
         }
      }

      newElements && loopar.Designer.updateElements(self, newElements, elementToDrag);

      DragAndDropUtils.elementToCreate = null;
      DragAndDropUtils.elementToDrag = null;
      DragAndDropUtils.lastElementTargetSibling = null;
   }

   sortElements(elements, movedElement, targetElement, type, direction = vertical_direction) {
      /**before moving the element, we need to check if the target element is in the elements array*/
      const targetInElements = elements.some(element => {
         return element.data.key === targetElement.data.key;
      });

      if (targetInElements && targetElement.data.key !== movedElement.data.key) {
         elements = elements.filter(element => {
            return element.data.key !== movedElement.data.key;
         });
      }

      /**if the target element is in the elements array, we need to move the element to the target element position*/
      if (movedElement && targetElement && targetElement.data.key !== movedElement.data.key && targetInElements) {
         return elements.reduce((acc, element) => {
            const data = element.data;

            /**if the element is the target element, we need to add the moved element before or after the target element*/
            if (data.key === targetElement.data.key) {
               acc = direction === UP ? [...acc, movedElement, element] : [...acc, element, movedElement];
            } else if (data.key !== movedElement.data.key) {
               acc = [...acc, element];
            }

            return acc;
         }, []);
      }

      /**if the target element is not in the elements array, we need to move the element to the last position*/
      return elements;
   }

   isParentOf(element) {
      if (!element) return false;
      if (element.parentComponent === this) return true;
      return this.isParentOf(element.parentComponent);
   }

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

      loopar.Designer.updateElements(this, removeDuplicates(newElements), null, callback);
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

   overAnimations() {
      this.setAttrs({
         onMouseOver: e => {
            this.addClass("hover");
         },
         onMouseOut: e => {
            this.removeClass("hover");
         }
      });

      return this;
   }

   get identifier() {
      const { key, id, name } = this.meta?.data || {};
      return key ?? id ?? name ?? elementManage.getUniqueKey();
   }
}