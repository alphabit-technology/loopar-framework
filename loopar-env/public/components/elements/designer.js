import {button, code, div, h4, h5, h6, i, pre, span, Tabs, Textarea, hr, Dialog, p} from "../elements.js";
import Component from "../base/component.js";
import {Element} from "/components/elements.js";
import GlobalContext from "/components/global-context.js";
import {loopar} from "/loopar.js";
import {element_manage} from "../element-manage.js";

export default class Designer extends Component {
   block_component = true;
   is_writable = true;
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
         div({className: "page-title-bar mb-2"}, [
            div({className: "row align-items-center"}, [
               div({className: "col-md-6 col-12"}, [
                  div({className: "page-title"}, [
                     h5({}, this.data.label)
                  ])
               ]),
               div({className: "col-md-6 col-12"}, [
                  div({className: "breadcrumb-bar text-right"}, [
                     div({className: "btn-group"}, [
                        button({
                           className: "btn btn-secondary btn-sm mr-1",
                           onClick: (e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              this.props.formRef.toggleDesign("designer");
                           }
                        }, [
                           i({className: "oi oi-brush mr-2"}),
                           "Design"
                        ]),
                        button({
                           className: "btn btn-secondary btn-sm mr-1",
                           onClick: (e) => {
                              e.preventDefault();
                              this.setState({IAGenerator: true, IAOperation: true});
                           }
                        }, [
                           i({ className: "fa fa-magic mr-2 text-success"}),
                           "Design IA"
                        ]),
                     ])
                  ])
               ]),
               Dialog({
                  title: [span({className: "fa fa-magic pr-2 text-success"}), "IA Generator via OpenAI"],
                  size: "lg",
                  open: this.state.IAGenerator,
                  scrollable: true,
                  content: [
                     div({className: "form-control bg-light", style: {minHeight: 100, padding: 0}},
                        pre({style: {padding: 10, position: "relative", height: "100%"}}, [
                           code({
                              className: "text-success",
                              style: {position: "absolute", height: "100%", width: "calc(100% -10px)"}
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
                           if(!this.promptInput){
                              loopar.throw("Empty prompt", "Please write a prompt to send the request");
                              return;
                           }
                           //this.setState({IAGenerator: false});
                           this.prompt();
                        },
                        internalAction: 'close'
                     }
                  ],
                  onClose: () => {
                     this.setState({IAGenerator: false});
                  }
               })
            ])
         ])
      ]
   }

   async prompt() {
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
                  this.setState({IAOperation: false});
               }
            }
         ]
      });

      loopar.method('GPT', 'prompt', {prompt: this.promptInput}).then((r) => {
         dialog.close();
         if(!this.state.IAOperation) return;

         const evaluateResponse = (message, start, end = start) => {
            if (message.includes(start)) {
               const startIndex = message.indexOf(start);
               const endIndex = message.lastIndexOf(end);
               return message.substring(startIndex, endIndex + end.length);
            }

            return message;
         }
         const elements = evaluateResponse(r.message, "[", "]");

         if (element_manage.isJSON(elements)) {
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
      });
   }

   render() {
      const meta = this.state.meta;
      const data = meta.data;
      const model = data.value || "[]";
      const formattedValue = JSON.stringify(JSON.parse(model), null, 3);

      const className = (loopar.sidebar_option !== "preview" ? " element designer design true" : "");

      return super.render([
         div({className: "card-header pb-1"}, [
            this.header()
            ///h4({className: "card-title"}, data.label),
         ]),
         div({style: {marginBottom: "-20px"}}, [
            Tabs({
               meta: {data: {name: this.props.meta.data.name + "_designer_tab"}},
               style: {paddingBottom: 0},
               bodyStyle: loopar.sidebar_option !== "preview" ? {padding: 0} : {},
               notManageSelectedStatus: this.props.designerRef
            }, [
               {
                  data: {
                     label: h6([span({className: "oi oi-brush mr-2"}), "Designer"]),
                     name: this.props.meta.data.name + "_designer-tab"
                  },
                  content: [
                     div({
                        className: "design design-area " + className,
                        style: {padding: 0, margin: 0}
                     }, [
                        div({
                           Component: this,
                           className: "collapse element sub-element droppable show" + (this.props.bodyClassName ? " " + this.props.bodyClassName : ""),
                           style: {...(this.state.collapsed ? {display: "none"} : {})},
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
                     label: h6([span({className: "fa fa-code mr-2"}), "Model"]),
                     name: this.props.meta.data.name + "_model-tab"
                  },
                  content: [
                     div({className: "form-control bg-light", style: {minHeight: 520, padding: 0}},
                        pre({style: {padding: 10, position: "relative", height: "100%"}}, [
                           code({
                              className: "text-success",
                              style: {position: "absolute", height: "100%", width: "calc(100% -10px)"}
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
               //key: element_manage.getUniqueKey(),
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
               key: element_manage.getUniqueKey(),
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
      this.setState({collapsed: !this.state.collapsed});
   }

   componentDidMount() {
      super.componentDidMount();
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

   set #elements(elements) {
      const data = this.state.meta.data;
      data.value = JSON.stringify(elements);
      this.state.meta.data = data;

      this.props.formRef.hydrate();

      setTimeout(() => {
         this.setState({meta: this.state.meta, IAOperation: false});
      }, 100);
   }

   get elements_dict() {
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
      this.props.formRef.toggleDesign("designer");
   }

   updateElement(name, data, merge = false) {
      const selfElements = this.#elements;
      const exist = this.findElementByName(data.name, selfElements, name);

      if (exist) {
         loopar.throw("Duplicate field", `The field with the name:${data.name} already exists, your current field will keep the name:${name} please check your fields and try again.`);
         return false;
      }

      const updateElement = (structure) => {
         return structure.map(el => {
            if (el.data.name === name) {
               el.data = merge ? {...el.data, ...data} : data;//{...el.data, ...data};
            } else {
               el.elements = updateElement(el.elements || []);
            }

            /**Purify Data */
            el.data = Object.entries(el.data).reduce((obj, [key, value]) => {
               if (![null, undefined, "", "0", 0, "false", false].includes(value)) {
                  obj[key] = value;
               }
               return obj;
            }, {});
            /**Purify Meta */

            return {element: el.element, data: el.data, elements: el.elements};
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