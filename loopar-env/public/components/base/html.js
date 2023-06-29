import { loopar } from "/loopar.js";
import { DragAndDropUtils } from "/tools/drag-and-drop.js";
import { styleToObject } from "/components/element-manage.js";
import { Element } from "/components/elements.js";
import {element_manage} from "../element-manage.js";

export class HTML extends React.Component {
   states = [];
   elements_list = [];

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

   merge_attributes(target, ...sources) {
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
      const single_tags = "input,textarea,img,switch,checkbox,hr,br,checkbox,script,link,meta,base,area,basefont,frame,embed,source,track,wbr,image".split(",");

      return single_tags.includes(tag);
   }

   render(content = null) {
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

      const tag = this.tag_name || this.props.tag_name || "div";
      const className = this.getClassName;
      if (className && className.length > 0) props.className = className;
      const animations = {}
      if(data.animation && !props.designer){
         animations["data-aos"] = data.animation;

         if(data.animation_delay){
            animations["data-aos-delay"] =  data.animation_delay;
         }

         if(data.animation_duration && data.animation_duration > 0){
            animations["data-aos-duration"] = data.animation_duration;
         }else{
            animations["data-aos-duration"] =  2000;
         }
      }
      
      const action = props?.meta?.data?.action;

      const component = [
         (tag === "image" ? "img" : tag),
         {
            ...Object.keys(props).reduce((acc, key) => {
               if (key !== "style" && !["object"].includes(typeof props[key]) && !["element", "tag_name", "key"].includes(key)) {
                  acc[key] = props[key];
               }
               return acc;
            }, {}),
            ...{ style: this.getStyle },
            ...this.state.attrs,
            ...((action && typeof props.docRef[action] == "function") ? { onClick: () => props.docRef[action]()} : {}),
            ...animations
         }
      ]

      if (!this.tagDontHaveChild(tag)) {
         component.push(children);
         !this.block_component && component.push(
            this.elements
         );
      }

      return React.createElement(...component);
   }

   get getStyle() {
      const selfStyle = this.style || {};
      const dataStyle = styleToObject(this.data.style) || {};

      return {...selfStyle, ...dataStyle, ...this.props.style || {}};
   }

   make() {
      if (this.props.Component) {
         this.Component = this.props.Component;
      }
   }

   get identifier() {
      return this.meta.identifier || this.data.name;
   }

   get elements() {
      return (this.meta?.elements || []).map(el => {
         return this.makeElement(el);
      });
   }

   makeElement(el, props = {}) {
      return Element(el.element, {...{
         ...(el.element === "tabs" && this.props.designerRef ? {key: element_manage.getUniqueKey()} : {}),
         ...(this.props.formRef ? { formRef: this.props.formRef } : {}),
         ...(this.props.docRef ? { docRef: this.props.docRef } : {}),
         ...(this.props.designerRef ? { designerRef: this.props.designerRef } : {}),
         ...(this.props.designer && {
            has_title: true, draggable: true, designer: true
         } || {}),
         ref: self => {
            if (self) {
               /*For inputs and other elements that have a name and have */
               if (this.props.formRef && el.data.name && !this.props.designer) {
                  if (self.is_writable){
                     /*For inputs elements*/
                     this.props.formRef.form_fields[el.data.name] = self;
                  }else{
                     /*For other elements*/
                     this.props.formRef[el.data.name] = self;
                  }
               }

               if (this.props.designer) {
                  self.parentComponent = this;
               }
            }
         },
         meta: {
            ...el
         },
      }, ...props})
   }

   add_child(child, merge = false) {
      this.setState({ children: child }, merge);
   }

   text(text) {
      this.setState({ children: text }, false);
   }

   on(event, callback) {
      this.setAttrs({ ["on" + event]: () => { callback() } });
   }

   show() {
      this.removeClass("no-display");
   }

   hide() {
      this.addClass("no-display");
   }

   get element() {
      return this.meta.element || this.props.element;
   }

   get getClassName() {
      const props = this.props;
      const selfClassName = this.className || '';
      const propsClassName = this.props.className || '';
      const stateClassName = (this.$state || {}).className || '';
      const dataClassName = ((this.props.meta?.data || {}).class || null);
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

   has_class(className) {
      return this.getClassName.includes(className);
   }

   toggle_class(class_name) {
      if (this.getClassName.includes(class_name)) {
         this.removeClass(class_name);
      } else {
         this.addClass(class_name);
      }
      return this;
   }

   replace_class(class_name, new_class_name) {
      const new_class = this.getClassName.replace(class_name, new_class_name);
      this.setState({ className: new_class });
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
      const last_state = this.state || {};
      const new_state = merge ? this.merge_attributes(last_state, state) : state;

      super.setState(new_state, typeof callback === "function" ? callback : undefined);
   }

   setAttrs(attr, value) {
      const current_attrs = this.state.attrs || {};

      if (typeof attr === "object") {
         this.setState({ attrs: { ...current_attrs, ...attr } }, null, true);
      } else {
         this.setState({ attrs: { ...current_attrs, [attr]: value } }, null, true);
      }
   }

   hasClass(class_name) {
      return this.getClassName.includes(class_name);
   }
   addClass(class_name) {
      if (this.hasClass(class_name)) return this;
      const where_is_class = (this.state || {}).className ? "state" : "props";

      const current_class = (this.getClassName + " " + class_name).split(" ").filter(c => c !== "" && c.length > 0)//.join(" ");
      const class_name_list = Array.from(new Set(current_class)).join(" ");

      if (where_is_class === "props") {
         this.className = class_name_list;
         this.setState({});
      } else {
         this.setState({ className: class_name_list });
      }

      return this;
   }

   removeClass(class_name) {
      if (!this.hasClass(class_name)) return this;
      const current_class = this.getClassName.split(" ");
      const where_is_class = (this.$state || {}).className ? "state" : "props";

      class_name.split(" ").map(c => {
         const index = current_class.indexOf(c);
         index > -1 && current_class.splice(index, 1);
      });

      if (where_is_class === "props") {
         this.className = current_class.join(" ");
         this.setState({});
      } else {
         this.setState({ className: current_class.join(" ") });
      }

      return this;
   }

   innerHtml(content) {
      return {
         dangerouslySetInnerHTML: { __html: content }
      }
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
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

   get meta() {
      const meta = this.state.meta || this.props.meta || {};
      return meta || {};
   }

   get data() {
      const data = this.meta.data || this.state.data;
      return data || {};
   }

   get node() {
      return this._reactInternals.child.stateNode;
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

   draggable_actions() {
      this.over_animations();

      this.setAttrs({
         draggable: true,
         onDragStart: (event) => {
            event.stopPropagation();

            this.addClass("on-drag");

            DragAndDropUtils.elementToDrag = this;
         },
         onDragEnter: (event) => {
            event.stopPropagation();

            this.apply_event_drag_end();
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

   droppable_actions() {
      this.over_animations();
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
            this.apply_event_drag_end();
         }
      });
   }

   apply_event_drag_end() {
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
      let elements = self.elements_dict;
      let new_elements = null;

      container.removeClass("over-drag");

      if (elementToCreate) {
         if (elementToCreate.element) {
            elements.push(elementToCreate);
            new_elements = this.sort_elements(elements, elementToCreate, lastElementTargetSibling, "create");
         }
      } else if (elementToDrag && elementToDrag !== self) {
         if (!elementToDrag.isParentOf(this)) {
            const element = Object.assign({}, elementToDrag.meta);

            if (elementToDrag.parentComponent !== self) {
               elements = elements.filter(e => {
                  return e.data.name !== elementToDrag.meta.data.name;
               });
               elements.push(element);
            }

            new_elements = this.sort_elements(elements, element, lastElementTargetSibling);
         }
      }

      new_elements && loopar.Designer.updateElements(self, new_elements, elementToDrag);

      DragAndDropUtils.elementToCreate = null;
      DragAndDropUtils.elementToDrag = null;
      DragAndDropUtils.lastElementTargetSibling = null;
   }

   sort_elements(elements, moved_element, target_element, type, direction = vertical_direction) {
      /**before moving the element, we need to check if the target element is in the elements array*/
      const target_in_elements = elements.some(element => {
         return element.data.name === target_element.data.name;
      });

      if (target_in_elements && target_element.data.name !== moved_element.data.name) {
         elements = elements.filter(element => {
            return element.data.name !== moved_element.data.name;
         });
      }

      /**if the target element is in the elements array, we need to move the element to the target element position*/
      if (moved_element && target_element && target_element.data.name !== moved_element.data.name && target_in_elements) {
         return elements.reduce((acc, element) => {
            const data = element.data;

            /**if the element is the target element, we need to add the moved element before or after the target element*/
            if (data.name === target_element.data.name) {
               acc = direction === UP ? [...acc, moved_element, element] : [...acc, element, moved_element];
            } else if (data.name !== moved_element.data.name) {
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
      return (this.parent_component || this).options.app;
   }

   set_elements(elements) {
      const meta = this.meta;
      meta.elements = elements;
      this.setState({ meta });
   }

   add_element(element = null) {
      if (!element) return;

      this.set_elements([...this.elements_dict, element], element);
   }

   /**Parent component is the component that contains the current element, only for Block Elements ej: Card*/
   get parent_component() {
      return this.options.component;
   }

   /**Parent element is the element that contains the current element for all Elements*/
   remove() {
      if (this.parent_element) {
         const current_elements = this.parent_element.elements_dict;
         current_elements.findIndex((element) => {
            if (element.data.name === this.data.name) {
               current_elements.splice(current_elements.indexOf(element), 1);
               return true;
            }
         });

         this.parent_element.set_elements(current_elements);
      }

      setTimeout(() => {
         //trigger && this.onRemove && this.onRemove();
         loopar.document_form && loopar.document_form.make_doc_structure();
      }, 0);
   }

   get elements_dict() {
      return this.meta.elements || [];
   }

   over_animations() {
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
}