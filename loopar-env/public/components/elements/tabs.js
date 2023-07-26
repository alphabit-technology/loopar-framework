import { a, i, ul, li, h1, h4 } from "../elements.js";
import { div } from "../elements.js";
import Component from "../base/component.js";
import { element_manage } from "../element-manage.js";
import { loopar } from "/loopar.js";

export default class Tabs extends Component {
   className = "card";
   droppable = false;
   block_component = true;

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         active: this.currentTab()
      }
   }

   addTab() {
      const elements = this.elementsDict;
      const [name, label] = [`tab_${element_manage.uuid()}`, `Tab ${elements.length + 1}`];

      elements.push({
         data: { name, id: name, label, droppable: true, draggable: false }
      });

      this.set_elements(elements);
      this.selectLastTab();
   }

   selectLastTab() {
      const elements = this.elementsDict;
      this.selectTab(elements[elements.length - 1]?.data?.name);
   }

   selectFirstTab() {
      const elements = this.elementsDict;
      this.selectTab(elements[0]?.data?.name);
   }

   removeTab(name) {
      this.set_elements(this.elementsDict.filter(element => element.data.name !== name));
      this.selectLastTab();
   }

   selectTab(name) {
      !this.props.notManageSelectedStatus && localStorage.setItem(this.props.meta.data.name, name);
      this.setState({ active: name });

      setTimeout(() => {
         this[name] && this.props.designer && loopar.sidebar_option !== "preview" && loopar.document_form.editElement(this[name].props);
      }, 50);
   }

   updateTab(name, data) {
      const elements = this.elementsDict.map((element) => {
         if (element.data.name === name) {
            element.data = data;
         }

         return element;
      });

      this.set_elements(elements);
   }

   set_elements(elements) {
      super.set_elements(elements);
      loopar.Designer.updateElements(this, this.elementsDict);
   }

   currentTab() {
      return this.props.notManageSelectedStatus ? null : localStorage.getItem(this.props.meta.data.name);
   }

   componentDidMount() {
      super.componentDidMount();

      if (this.elementsDict.length === 0 && this.props.designer) {
         this.addTab();
      } else {
         !this.checkIfTabExists(this.currentTab()) && this.selectFirstTab();
      }
   }

   componentDidUpdate(prevProps, prevState, snapshot) {
      super.componentDidUpdate(prevProps, prevState, snapshot);
   }

   checkIfTabExists(name) {
      return this.elementsDict.some(element => element.data.name === name);
   }

   get elementsDict() {
      return this.props.children || super.elementsDict;
   }

   render() {
      const elementsDict = this.elementsDict;
      const bodyStyle = this.props.bodyStyle || {};
      return super.render([
         div({ className: 'card-header', style: { ...(this.props.headerStyle || {}) } }, [
            this.props.meta.data.label ? h4({ className: "card-title" }, this.props.meta.data.label) : null,
            ul({ className: "nav nav-tabs card-header-tabs" }, [
               elementsDict.map(element => {
                  return li({
                     className: "nav-item"
                  }, [
                     a({
                        className: "nav-link" + (element.data.name === this.state.active ? " active" : ""),
                        onClick: (e) => {
                           e.preventDefault();
                           this.selectTab(element.data.name);
                        },
                        "data-toggle": "tab"
                     }, element.data.label)
                  ])
               }),
               this.props.designer ? li({ className: "nav-item" }, [
                  a({
                     className: "nav-link", onClick: e => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.addTab();
                     }
                  }, [
                     i({ className: "fa fa-plus" })
                  ])
               ]) : null,
            ])
         ]),
         div({
            className: "card-body",
            style: bodyStyle
         }, [
            div({
               className: "tab-content"
            }, [
               ...elementsDict.map(element => {
                  return Tab({
                     element: "tab",
                     className: "sub-element tab-pane fade" + (element.data.name === this.state.active ? " show active" : ""),
                     style: {
                        display: element.data.name === this.state.active ? "block" : "none"
                     },
                     meta: {
                        data: element.data,
                        elements: element.elements,
                     },
                     draggable: false,
                     key: element.data.name,
                     element_title: element.data.label,
                     designerRef: this.props.designerRef,
                     ...(this.props.formRef ? { formRef: this.props.formRef } : {}),
                     ...(this.props.designerRef ? { designerRef: this.props.designerRef } : {}),
                     ...(this.props.designer && {
                        has_title: true, draggable: true, designer: true
                     } || {}),
                     ref: tab => {
                        if (tab) {
                           this[element.data.name] = tab;
                           if (this.props.designer) {
                              tab.parentComponent = this;
                           }
                        }
                     }
                  }, element.content)
               })
            ])
         ])
      ]);
   }
}

class TabClass extends Component {
   constructor(props) {
      super(props);
   }

   remove() {
      this.props.parent_element.removeTab(this.props.meta.data.name);
   }

   setData(data) {
      super.setData(data);
      this.props.parent_element.updateTab(this.props.meta.data.name, data);
   }
}

const Tab = (options, content) => {
   return React.createElement(TabClass, options, content);
}