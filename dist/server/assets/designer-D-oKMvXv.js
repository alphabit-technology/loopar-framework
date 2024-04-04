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
var __privateMethod = (obj, member, method) => {
  __accessCheck(obj, member, "access private method");
  return method;
};
var _elements, elements_get, _findDuplicateNames, findDuplicateNames_fn;
import { jsxs, jsx } from "react/jsx-runtime";
import { C as Component, D as Droppable } from "./component-hNq1V6er.js";
import { e as elementsDict, B as Button, l as loopar } from "../entry-server.js";
import { Modal } from "./dialog-nmg_tOQf.js";
import { f as fileManager } from "./file-manager-elzUYIBp.js";
import Tabs from "./tabs-yHXtTGWg.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import { b as useDocument, D as DesignerContext, a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import "./scroll-area-5SWWHlEI.js";
import { F as FormField } from "./form-field-WWLBJIO2.js";
import { B as BaseFormContext } from "./form-context-8n26Uc_0.js";
import { useState } from "react";
import "./form-z4zN6fsS.js";
import "clsx";
import "./textarea-lrGfzAVc.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { C as Code2 } from "./code-2-FyQB0-ma.js";
import "react-dom/server";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./dialog-9N_htvR6.js";
import "@radix-ui/react-dialog";
import "./x-3j0F7ehT.js";
import "./input-LY3ihqM_.js";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "./tabs-w0GUUrmU.js";
import "@radix-ui/react-tabs";
import "./plus-kMrZWx_A.js";
import "./element-title-oSDJ5F20.js";
import "@radix-ui/react-scroll-area";
import "./workspace-provider-ZZuPyRcj.js";
import "@hookform/resolvers/zod";
import "@radix-ui/react-separator";
import "react-hook-form";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Brush = createLucideIcon("Brush", [
  ["path", { d: "m9.06 11.9 8.07-8.06a2.85 2.85 0 1 1 4.03 4.03l-8.06 8.08", key: "1styjt" }],
  [
    "path",
    {
      d: "M7.07 14.94c-1.66 0-3 1.35-3 3.02 0 1.33-2.5 1.52-2 2.02 1.08 1.1 2.49 2.02 4 2.02 2.2 0 4-1.8 4-4.04a3.01 3.01 0 0 0-3-3.02z",
      key: "z0l1mu"
    }
  ]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Eye = createLucideIcon("Eye", [
  ["path", { d: "M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z", key: "rwhkz3" }],
  ["circle", { cx: "12", cy: "12", r: "3", key: "1v7zrd" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Star = createLucideIcon("Star", [
  [
    "polygon",
    {
      points: "12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2",
      key: "8f66p6"
    }
  ]
]);
const MetaComponents = ({ metaComponents, name: name2, designerRef }) => {
  const [design, setDesign] = useState(false);
  const document = useDocument();
  const toggleDesign = (mode) => {
    setDesign(mode !== void 0 ? mode : !design);
  };
  const handleEditElement = (element) => {
    document.handleSetEditElement(element);
  };
  const handleDeleteElement = (element) => {
    loopar.dialog({
      type: "confirm",
      title: "Delete element",
      message: "Are you sure you want to delete this element?",
      open: true,
      ok: () => {
        designerRef.deleteElement(element.data.key);
      }
    });
  };
  return /* @__PURE__ */ jsx(
    DesignerContext.Provider,
    {
      value: {
        designerMode: true,
        designerRef,
        design: document.mode === "designer",
        toggleDesign,
        handleEditElement,
        handleDeleteElement
      },
      children: /* @__PURE__ */ jsx(
        DynamicComponent,
        {
          elements: JSON.parse(metaComponents || "[]"),
          parent: designerRef,
          ref: (self) => {
            if (self)
              self.parentComponent = designerRef;
          }
        },
        elementManage.getUniqueKey()
      )
    }
  );
};
const DesignerButton = () => {
  const document = useDocument();
  return /* @__PURE__ */ jsxs(
    Button,
    {
      variant: "secondary",
      onClick: (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.handleChangeMode();
      },
      children: [
        document.mode === "designer" ? /* @__PURE__ */ jsx(Eye, { className: "mr-2" }) : /* @__PURE__ */ jsx(Brush, { className: "mr-2" }),
        document.mode === "designer" ? "Preview" : "Design"
      ]
    }
  );
};
class Designer extends Component {
  constructor(props) {
    super(props);
    __privateAdd(this, _elements);
    __privateAdd(this, _findDuplicateNames);
    __publicField(this, "isWritable", true);
    __publicField(this, "fieldControl", {});
    this.state = {
      ...this.state,
      //data: props.data,
      collapsed: false,
      IAGenerator: false,
      IAOperation: false,
      initialized: false
      //newElements: null
    };
  }
  get droppable() {
    return false;
  }
  get requires() {
    return {
      //css: ["/assets/designer"],
      modules: Object.values(elementsDict).filter((el) => el.def.show_in_design !== false).map((el) => el.def.element)
    };
  }
  header() {
    return /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-row justify-between", children: [
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx("h1", { className: "text-xl", children: this.data.label }) }),
      this.props.fieldDesigner && /* @__PURE__ */ jsxs("div", { className: "space-x-1", children: [
        /* @__PURE__ */ jsx(DesignerButton, {}),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "secondary",
            onClick: (e) => {
              e.preventDefault();
              e.stopPropagation();
              this.setState({ IAGenerator: true, IAOperation: true });
            },
            children: [
              /* @__PURE__ */ jsx(Star, { className: "mr-2" }),
              "Design IA"
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Modal,
          {
            title: "IA Generator via CHAT GPT-3.5",
            icon: /* @__PURE__ */ jsx("span", { className: "fa fa-magic pr-2 text-success" }),
            size: "md",
            open: this.state.IAGenerator,
            scrollable: true,
            buttons: [
              {
                name: "send",
                label: "Send",
                onClick: (e) => {
                  this.prompt();
                },
                internalAction: "close"
              }
            ],
            onClose: (e) => {
              this.setState({ IAGenerator: false });
            },
            children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
              /* @__PURE__ */ jsx("div", { className: "relative bg-card/50 rounded-lg border text-card-foreground", children: /* @__PURE__ */ jsx("pre", { className: "relative p-4 h-full", children: /* @__PURE__ */ jsxs("code", { className: "text-success w-full h-full text-pretty font-mono text-md font-bold text-green-600", children: [
                /* @__PURE__ */ jsx("p", { className: "pb-2 border-b-2", children: "Based on the type of API you have contracted with OpenAI, you may need to wait for a specific" }),
                /* @__PURE__ */ jsx("p", { className: "pt-2", children: 'Petition example: "Generate a form that allows me to manage inventory data."' })
              ] }) }) }),
              /* @__PURE__ */ jsx(
                "textarea",
                {
                  name: "PROMPT",
                  rows: 20,
                  onChange: (ref) => {
                    this.promptInput = ref.target.value;
                  },
                  className: "bg-transparent w-full h-50 border border-input rounded-md p-2"
                }
              )
            ] })
          }
        )
      ] })
    ] });
  }
  async prompt() {
    if (!this.promptInput) {
      loopar.throw(
        "Empty prompt",
        "Please write a prompt to send the request."
      );
      return;
    }
    if (!this.context.getValues("type")) {
      loopar.throw(
        "Empty document",
        "Please select a document to send the request."
      );
      return;
    }
    const dialog = await loopar.dialog({
      type: "info",
      title: "Wait a moment",
      content: "Please wait for the response, this may take a few minutes.",
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
    loopar.method("GPT", "prompt", {
      prompt: this.promptInput,
      document_type: this.context.getValues("type")
    }).then((r) => {
      dialog.close();
      if (!this.state.IAOperation)
        return;
      const evaluateResponse = (message, start, end = start) => {
        if (message.includes(start)) {
          const startIndex = message.indexOf(start);
          const endIndex = message.lastIndexOf(end);
          return message.substring(startIndex, endIndex + end.length);
        }
        return message;
      };
      const elements = evaluateResponse(r.message, "[", "]");
      if (elementManage.isJSON(elements)) {
        this.makeElements(JSON.parse(elements));
      } else {
        this.setState({
          IAOperation: false
        });
        loopar.dialog({
          type: "error",
          title: "Incorrect response",
          content: "Please resend petition to try to receive a correct format"
        });
      }
    }).catch((e) => {
      dialog.close();
    });
  }
  render() {
    const data = this.props.data || {};
    const className = loopar.sidebarOption !== "preview" ? " element designer design true bg-red-100" : "";
    return /* @__PURE__ */ jsxs("div", { className: "border rounded-sm p-2", children: [
      this.header(),
      /* @__PURE__ */ jsx(
        FormField,
        {
          name: data.name,
          render: ({ field }) => {
            return /* @__PURE__ */ jsx(
              Tabs,
              {
                data: { name: field.name + "_designer_tab" },
                notManageSelectedStatus: !this.props.fieldDesigner,
                asChild: true,
                children: [
                  {
                    className: "design-area design true",
                    data: {
                      label: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
                        /* @__PURE__ */ jsx(Brush, { className: "h-6 w-6 pr-2" }),
                        " Designer"
                      ] }),
                      name: field.name + "_designer-tab",
                      key: field.name + "_designer-tab"
                    },
                    content: [
                      /* @__PURE__ */ jsx(
                        "div",
                        {
                          className: "design design-area rounded-lg border bg-card/50 text-card-foreground shadow-sm w-full p-2" + className,
                          children: /* @__PURE__ */ jsx(
                            Droppable,
                            {
                              receiver: this,
                              isDesigner: this.props.fieldDesigner,
                              isDroppable: this.props.fieldDesigner,
                              className: "space-y-5",
                              children: /* @__PURE__ */ jsx(
                                MetaComponents,
                                {
                                  name: field.name,
                                  metaComponents: field.value,
                                  designerRef: this
                                }
                              )
                            }
                          )
                        }
                      )
                    ]
                  },
                  {
                    data: {
                      label: /* @__PURE__ */ jsxs("div", { className: "flex", children: [
                        /* @__PURE__ */ jsx(Code2, { className: "h-6 w-6 pr-2" }),
                        "Model"
                      ] }),
                      name: field.name + "_model-tab",
                      key: field.name + "_model-tab"
                    },
                    content: [
                      /* @__PURE__ */ jsx("div", { className: "text-success-500 max-h-[720px] overflow-x-auto whitespace-pre-wrap rounded-lg border p-2 font-mono text-sm font-bold text-green-600", children: JSON.stringify(JSON.parse(field.value || "[]"), null, 2) })
                    ]
                  }
                ]
              }
            );
          }
        },
        elementManage.getUniqueKey()
      )
    ] });
  }
  toggleHide() {
    this.setState({ collapsed: !this.state.collapsed });
  }
  componentDidMount() {
    super.componentDidMount();
    if (this.props.fieldDesigner) {
      loopar.Designer = this;
    } else {
      return;
    }
    const fixElements = JSON.stringify(elementManage.fixElements(
      __privateGet(this, _elements, elements_get)
    ));
    if (JSON.stringify(__privateGet(this, _elements, elements_get)) !== fixElements) {
      this.hydrateForm(fixElements);
    }
  }
  updateElements(target, elements, current = null, callback) {
    const currentElements = __privateGet(this, _elements, elements_get);
    const targetKey = target.data.key;
    const currentKey = current ? current.data.key : null;
    const lastParentKey = current ? current.parentComponent.data.key : null;
    const selfKey = this.props.data.key;
    const setElementsInTarget = (structure) => {
      return structure.map((el) => {
        el.elements = el.data.key === targetKey ? elements : setElementsInTarget(el.elements || []);
        return el;
      });
    };
    let newElements = targetKey === selfKey ? elements : setElementsInTarget(currentElements);
    const deleteCurrentOnLastParent = (structure, parent) => {
      if (lastParentKey === parent) {
        return structure.filter((e) => e.data.key !== currentKey);
      }
      return structure.map((el) => {
        el.elements = deleteCurrentOnLastParent(el.elements || [], el.data.key);
        return el;
      });
    };
    if (current && lastParentKey !== targetKey) {
      newElements = deleteCurrentOnLastParent(newElements, selfKey);
    }
    this.hydrateForm(JSON.stringify(newElements));
  }
  findElement(field, value, elements = __privateGet(this, _elements, elements_get)) {
    for (let i = 0; i < elements.length; i++) {
      if (elements[i].data[field] === value) {
        return elements[i];
      } else if (elements[i].elements) {
        const found = this.findElement(field, value, elements[i].elements);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
  makeElements(elements, callback) {
    const data = this.data;
    data.value = JSON.stringify(elementManage.fixElements(elements));
    this.hydrateForm(data.value, callback);
  }
  hydrateForm(elements, callback) {
    this.context.setValue(this.props.data.name, elements);
    this.setState({}, callback);
  }
  get elementsDict() {
    return __privateGet(this, _elements, elements_get);
  }
  deleteElement(element) {
    const removeElement = (elements = __privateGet(this, _elements, elements_get)) => {
      return elements.filter((el) => {
        if (el.data.key === element) {
          return false;
        } else if (el.elements) {
          el.elements = removeElement(el.elements);
        }
        return true;
      });
    };
    this.makeElements(removeElement());
  }
  updateElement(key, data, merge = true) {
    const selfElements = __privateGet(this, _elements, elements_get);
    if (data.name) {
      const exist = this.findElement("name", data.name, selfElements);
      if (exist && exist.data.key !== key) {
        loopar.throw(
          "Duplicate field",
          `The field with the name: ${data.name} already exists, your current field will keep the name: ${name} please check your fields and try again.`
        );
        return false;
      }
    }
    const updateElement = (structure) => {
      return structure.map((el) => {
        var _a;
        if (el.data.key === key) {
          el.data = merge ? Object.assign({}, el.data, data) : data;
          (_a = el.data).key ?? (_a.key = elementManage.getUniqueKey());
        } else {
          el.elements = updateElement(el.elements || []);
        }
        if (el.data.background_image) {
          el.data.background_image = JSON.stringify(
            fileManager.getMappedFiles(el.data.background_image)
          );
        }
        el.data = Object.entries(el.data).reduce((obj, [key2, value]) => {
          if (key2 === "background_color" && JSON.stringify(value) === '{"color":"#000000","alpha":0.5}') {
            return obj;
          }
          if (![
            null,
            void 0,
            "",
            "0",
            "false",
            false,
            '{"color":"#000000","alpha":0.5}'
          ].includes(value)) {
            obj[key2] = value;
          }
          return obj;
        }, {});
        return { element: el.element, data: el.data, elements: el.elements };
      });
    };
    this.makeElements(updateElement(selfElements));
    return true;
  }
  val() {
    return this.context.getValues(this.props.data.name);
  }
  validate() {
    const duplicates = __privateMethod(this, _findDuplicateNames, findDuplicateNames_fn).call(this);
    return {
      valid: !duplicates.length,
      message: `Duplicate names: ${duplicates.join(
        ", "
      )}, please check your structure.`
    };
  }
}
_elements = new WeakSet();
elements_get = function() {
  return JSON.parse(this.context.getValues(this.props.data.name) || "[]");
};
_findDuplicateNames = new WeakSet();
findDuplicateNames_fn = function() {
  const elements = __privateGet(this, _elements, elements_get);
  const [names, duplicates] = [/* @__PURE__ */ new Set(), /* @__PURE__ */ new Set()];
  const traverseElements = (el) => {
    if (el.data.name && names.has(el.data.name)) {
      duplicates.add(el.data.name);
    } else {
      names.add(el.data.name);
    }
    if (el.elements && el.elements.length) {
      el.elements.forEach(traverseElements);
    }
  };
  elements.forEach(traverseElements);
};
__publicField(Designer, "contextType", BaseFormContext);
export {
  Designer as default
};
