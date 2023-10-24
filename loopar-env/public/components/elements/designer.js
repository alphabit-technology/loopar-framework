import { button, code, div, h4, h5, h6, i, pre, span, Tabs, Textarea, hr, Dialog, p } from "../elements.js";
import Component from "../base/component.js";
import GlobalContext from "/components/global-context.js";
import { loopar } from "/loopar.js";
import { elementManage } from "../element-manage.js";
import { Modal } from "/components/common/dialog.js";

export default class Designer extends Component {
   blockComponent = true;
   isWritable = true;
   static contextType = GlobalContext;
   droppable = false;
   className = "card";

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         meta: props.meta,
         collapsed: false,
         IAGenerator: false,
         IAOperation: false
      }
   }

   header() {
      return [
         div({ className: "page-title-bar mb-2" }, [
            div({ className: "row align-items-center" }, [
               div({ className: "col-md-6 col-12" }, [
                  div({ className: "page-title" }, [
                     h5({}, this.data.label)
                  ])
               ]),
               div({ className: "col-md-6 col-12" }, [
                  div({ className: "breadcrumb-bar text-right" }, [
                     div({ className: "btn-group" }, [
                        button({
                           className: "btn btn-secondary btn-sm mr-1",
                           onClick: (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              this.props.docRef.toggleDesign("designer");
                           }
                        }, [
                           i({ className: "oi oi-brush mr-2" }),
                           "Design"
                        ]),
                        button({
                           className: "btn btn-secondary btn-sm mr-1",
                           onClick: (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              this.setState({ IAGenerator: true, IAOperation: true });
                           }
                        }, [
                           i({ className: "fa fa-magic mr-2 text-success" }),
                           "Design IA"
                        ]),
                     ])
                  ])
               ]),
               Modal({
                  title: ["IA Generator via OpenAI"],
                  icon: span({ className: "fa fa-magic pr-2 text-success" }),
                  size: "lg",
                  open: this.state.IAGenerator,
                  scrollable: true,
                  content: [
                     div({ className: "form-control bg-light", style: { minHeight: 100, padding: 0 } },
                        pre({ style: { padding: 10, position: "relative", height: "100%" } }, [
                           code({
                              className: "text-success",
                              style: { position: "absolute", height: "100%", width: "calc(100% -10px)" }
                           }, [
                              'Based on the type of API you have contracted with OpenAI, you may need to wait for a specific',
                              hr(),
                              'Petition example: "Generate a form that allows me to manage inventory data."'
                           ])
                        ])
                     ),
                     Textarea({
                        widthOutLabel: true,
                        meta: {
                           data: {
                              name: "PROMPT",
                              rows: 20
                           }
                        },
                        onChange: (ref) => {
                           this.promptInput = ref.target.value;
                        }
                     })
                  ],
                  buttons: [
                     {
                        name: "send",
                        label: "Send",
                        onClick: (e) => {
                           this.prompt();
                        },
                        internalAction: 'close'
                     }
                  ],
                  onClose: (e) => {
                     this.setState({ IAGenerator: false });
                  }
               })
            ])
         ])
      ]
   }

   async prompt() {
      if (!this.promptInput) {
         loopar.throw("Empty prompt", "Please write a prompt to send the request.");
         return;
      }

      if (!this.props.docRef.getValue("type")) {
         loopar.throw("Empty document", "Please select a document to send the request.");
         return;
      }

      const dialog = await loopar.dialog({
         type: "info",
         title: "Wait a moment",
         content: [
            p({}, "Please wait for the response, this may take a few minutes."),
         ],
         buttons: [
            {
               name: "cancel",
               label: "Cancel",
               onClick: (e) => {
                  this.setState({ IAOperation: false });
               }
            }
         ]
      });

      loopar.method('GPT', 'prompt', {
         prompt: this.promptInput,
         document_type: this.props.docRef.getValue("type"),
      }).then((r) => {
         dialog.close();
         if (!this.state.IAOperation) return;

         const evaluateResponse = (message, start, end = start) => {
            if (message.includes(start)) {
               const startIndex = message.indexOf(start);
               const endIndex = message.lastIndexOf(end);
               return message.substring(startIndex, endIndex + end.length);
            }

            return message;
         }
         const elements = evaluateResponse(r.message, "[", "]");

         if (elementManage.isJSON(elements)) {
            this.#elements = JSON.parse(elements);
         } else {
            this.setState({
               IAOperation: false
            });
            loopar.dialog({
               type: "error",
               title: "Incorrect response",
               content: "Please resend petition to try to receive a correct format"
            })
         }
      }).catch(e => {
         dialog.close();
      });
   }

   render() {
      const meta = this.state.meta;
      const data = meta.data;
      const model = data.value || "[]";
      const formattedValue = JSON.stringify(JSON.parse(model), null, 3);

      const className = (loopar.sidebarOption !== "preview" ? " element designer design true" : "");

      return super.render([
         div({ className: "card-header pb-1" }, [
            this.header()
            ///h4({className: "card-title"}, data.label),
         ]),
         div({ style: { marginBottom: "-20px" } }, [
            Tabs({
               meta: { data: { name: this.props.meta.data.name + "_designer_tab" } },
               style: { paddingBottom: 0 },
               bodyStyle: loopar.sidebarOption !== "preview" ? { padding: 0 } : {},
               notManageSelectedStatus: this.props.designerRef
            }, [
               {
                  data: {
                     label: h6([span({ className: "oi oi-brush mr-2" }), "Designer"]),
                     name: this.props.meta.data.name + "_designer-tab"
                  },
                  content: [
                     div({
                        className: "design design-area " + className,
                        style: { padding: 0, margin: 0 }
                     }, [
                        div({
                           Component: this,
                           className: "collapse element sub-element droppable show" + (this.props.bodyClassName ? " " + this.props.bodyClassName : ""),
                           style: { ...(this.state.collapsed ? { display: "none" } : {}) },
                           ref: self => this.container = self
                        }, [
                           this.elements,
                           this.getDesignElements()
                        ])
                     ])
                  ]
               },
               {
                  data: {
                     label: h6([span({ className: "fa fa-code mr-2" }), "Model"]),
                     name: this.props.meta.data.name + "_model-tab"
                  },
                  content: [
                     div({ className: "form-control bg-light", style: { minHeight: 520, padding: 0 } },
                        pre({ style: { padding: 10, position: "relative", height: "100%" } }, [
                           code({
                              className: "text-success",
                              style: { position: "absolute", height: "100%", width: "calc(100% -10px)" }
                           }, [
                              formattedValue
                           ])
                        ])
                     )
                  ]
               }
            ]),
         ])
      ]);
   }

   getDesignElements() {
      const makeElements = (elements) => {
         return elements.map(el => {
            return super.makeElement(el, {
               //key: elementManage.getUniqueKey(),
               draggable: true,
               designer: true,
               has_title: true,
               designerRef: this,
               meta: {
                  ...el,
               },
               ref: self => {
                  if (self) self.parentComponent = this;
               }
            })//
            /*return Element(el.element, {
               key: elementManage.getUniqueKey(),
               draggable: true,
               designer: true,
               has_title: true,
               designerRef: this,
               meta: {
                  ...el,
               },
               ref: self => {
                  if (self) self.parentComponent = this;
               }
            })*/
         });
      }

      return makeElements(this.#elements);
   }

   toggleHide() {
      this.setState({ collapsed: !this.state.collapsed });
   }

   componentDidMount() {
      super.componentDidMount();
      loopar.scriptManager.loadStylesheet("/assets/plugins/loopar/css/designer");
      if (this.props.fieldDesigner) loopar.Designer = this;
   }

   updateElements(target, elements, current = null) {
      const currentElements = JSON.parse(this.state.meta.data.value || "[]");
      const targetName = target.meta.data.name;
      const currentName = current ? current.meta.data.name : null;
      const lastParentName = current ? current.parentComponent.meta.data.name : null;
      const selfName = this.state.meta.data.name;

      /**Search target in structure and set elements in target*/
      const setElementsInTarget = (structure) => {
         return structure.map(el => {
            el.elements = el.data.name === targetName ? elements : setElementsInTarget(el.elements || []);
            return el;
         });
      }

      /**Search target in structure and set elements in target, if target is self set directly in self*/
      let newElements = targetName === selfName ? elements : setElementsInTarget(currentElements, selfName);

      /**Search current in structure and delete current in last parent*/
      const deleteCurrentOnLastParent = (structure, parent) => {
         if (lastParentName === parent) {
            return structure.filter(e => e.data.name !== currentName);
         }

         return structure.map(el => {
            el.elements = deleteCurrentOnLastParent(el.elements || [], el.data.name);
            return el;
         });
      }

      if (current && lastParentName !== targetName) {
         newElements = deleteCurrentOnLastParent(newElements, selfName);
      }

      this.#elements = newElements;
   }

   findElementByName(name, elements = this.#elements, keep) {
      for (let i = 0; i < elements.length; i++) {
         if (elements[i].data.name === name && elements[i].data.name !== keep) {
            return elements[i];
         } else if (elements[i].elements) {
            const found = this.findElementByName(name, elements[i].elements, keep);
            if (found) {
               return found;
            }
         }
      }
      return null;
   }

   get #elements() {
      return JSON.parse(this.state.meta.data.value || "[]");
   }

   fixElements(elements) {
      return elements.map(el => {
         if (!el.data) {
            const names = elementManage.elementName(el.element);
            el.data = {
               name: names.name,
               label: loopar.utils.Capitalize(names.label.replaceAll('_', ' ')),
               id: names.id
            }
         }
         if (el.elements) {
            el.elements = this.fixElements(el.elements);
         }
         return el;
      });
   }

   set #elements(elements) {
      const data = this.state.meta.data;
      data.value = JSON.stringify(this.fixElements(elements));
      this.state.meta.data = data;

      this.props.docRef.hydrate();

      setTimeout(() => {
         this.setState({ meta: this.state.meta, IAOperation: false });
      }, 100);
   }

   get elementsDict() {
      return this.#elements;
   }

   deleteElement(element) {
      const removeElement = (elements = this.#elements) => {
         return elements.filter(el => {
            if (el.data.name === element) {
               return false;
            } else if (el.elements) {
               el.elements = removeElement(el.elements);
            }

            return true;
         });
      }

      this.#elements = removeElement();
      this.props.docRef.toggleDesign("designer");
   }

   updateElement(name, data, merge = true) {
      const selfElements = this.#elements;
      const exist = this.findElementByName(data.name, selfElements, name);

      if (exist) {
         loopar.throw("Duplicate field", `The field with the name:${data.name} already exists, your current field will keep the name:${name} please check your fields and try again.`);
         return false;
      }

      const updateElement = (structure) => {
         return structure.map(el => {
            if (el.data.name === name) {
               el.data = merge ? { ...el.data, ...data } : data;//{...el.data, ...data};
            } else {
               el.elements = updateElement(el.elements || []);
            }

            /**Purify Data */
            el.data = Object.entries(el.data).reduce((obj, [key, value]) => {
               if (![null, undefined, "", "0", "false", false].includes(value)) {
                  obj[key] = value;
               }
               return obj;
            }, {});
            /**Purify Meta */

            return { element: el.element, data: el.data, elements: el.elements };
         });
      }

      this.#elements = updateElement(selfElements);
      return true;
   }

   val() {
      return this.meta.data.value;
   }

   #findDuplicateNames() {
      const elements = JSON.parse(this.state.meta.data.value || "[]");
      const [names, duplicates] = [new Set(), new Set()];

      const traverseElements = (el) => {
         if (names.has(el.data.name)) {
            duplicates.add(el.data.name);
         } else {
            names.add(el.data.name);
         }

         if (el.elements && el.elements.length) {
            el.elements.forEach(traverseElements);
         }
      };

      elements.forEach(traverseElements);

      return Array.from(duplicates);
   }

   validate() {
      const duplicates = this.#findDuplicateNames();

      return {
         valid: !duplicates.length,
         message: `Duplicate names: ${duplicates.join(", ")}, please check your structure.`
      };
   }
}