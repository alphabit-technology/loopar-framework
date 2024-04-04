var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, jsx } from "react/jsx-runtime";
import { C as Component, D as Droppable } from "./component-hNq1V6er.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import { l as loopar, B as Button } from "../entry-server.js";
import { T as Tabs$1, a as TabsList, b as TabsTrigger, c as TabsContent } from "./tabs-w0GUUrmU.js";
import { D as DesignerContext, a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import { P as Plus } from "./plus-kMrZWx_A.js";
import "./file-manager-elzUYIBp.js";
import "react";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "@radix-ui/react-tabs";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
class Tabs extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "droppable", false);
    __publicField(this, "blockComponent", true);
    this.state = {
      ...this.state,
      active: this.currentTab()
    };
  }
  addTab() {
    const elements = this.elementsDict;
    const [name, label] = [
      `tab_${elementManage.uuid()}`,
      `Tab ${elements.length + 1}`
    ];
    const tab = [
      {
        element: "tab",
        data: {
          name,
          id: name,
          label,
          droppable: true,
          draggable: false,
          key: name
        }
      }
    ];
    loopar.utils.cookie.set(this.identifier, name);
    this.setElements(tab, () => {
    });
  }
  selectLastTab() {
    var _a;
    const elements = this.elementsDict;
    const element = elements[elements.length - 1];
    this.selectTab(((_a = element == null ? void 0 : element.data) == null ? void 0 : _a.key) || (element == null ? void 0 : element.key));
  }
  selectFirstTab() {
    var _a;
    const elements = this.elementsDict;
    const element = elements[0];
    this.selectTab(((_a = element == null ? void 0 : element.data) == null ? void 0 : _a.key) || (element == null ? void 0 : element.key));
  }
  /*removeTab(key) {
      console.log("removing tab", key)
      this.setElements(this.elementsDict.filter(element => element.data.key !== key), false, () => {
         this.selectLastTab();
      });
   }*/
  get identifier() {
    var _a;
    return `${super.identifier}${((_a = this.context) == null ? void 0 : _a.designerMode) ? "-designer" : ""}`;
  }
  selectTab(key) {
    loopar.utils.cookie.set(this.identifier, key);
    this.setState(
      (prevState) => {
        if (prevState.active !== key) {
          return { active: key };
        }
      },
      () => {
      }
    );
  }
  updateTab(key, data) {
    const elements = this.elementsDict.map((element) => {
      if (element.key === key) {
        element.data = data;
      }
      return element;
    });
    this.setElements(elements, null, false);
  }
  /*setElements(elements, callback) {
      super.setElements([], () => {
         callback && callback();
      });
   }*/
  currentTab() {
    return loopar.utils.cookie.get(this.identifier);
  }
  componentDidMount() {
    super.componentDidMount();
    if (!this.state.active && this.elementsDict.length > 0) {
      this.selectFirstTab();
    }
    if (this.elementsDict.length === 0 && this.context.designerMode) {
      this.addTab();
    } else {
      !this.checkIfTabExists(this.currentTab()) && this.selectFirstTab();
    }
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);
    const currentTab = this.currentTab();
    if (currentTab && !this.checkIfTabExists(currentTab)) {
      this.selectFirstTab();
    }
  }
  checkIfTabExists(key) {
    return this.elementsDict.some((element) => (element == null ? void 0 : element.key) === key);
  }
  get elementsDict() {
    const els = (this.context.designerMode1 ? super.elementsDict : this.props.children || super.elementsDict) || [];
    if (Array.isArray(els)) {
      return els;
    } else {
      return Object.values(els);
    }
  }
  render() {
    const elementsDict = this.elementsDict || [];
    const current = this.state.active;
    const handleChange = (key) => {
      this.selectTab(key);
    };
    return /* @__PURE__ */ jsxs("div", { className: "border p-2 my-3", children: [
      this.props.data.label ? /* @__PURE__ */ jsx("h4", { className: "p-2", children: this.props.data.label }) : null,
      /* @__PURE__ */ jsxs(Tabs$1, { defaultValue: current, className: "w-full", children: [
        /* @__PURE__ */ jsxs(TabsList, { className: "inline-table", children: [
          ...elementsDict.map((element) => {
            const data = (element.props ? element.props.data : element.data) || {};
            const tabKey = data.key || element.key;
            if (element.$$typeof === Symbol.for("react.element")) {
              element = Object.entries(element.props || {}).reduce(
                (obj, [key, value]) => {
                  if (key !== "children") {
                    obj[key] = value;
                  }
                  return obj;
                },
                { key: element.key || element.data.key }
              );
            } else {
              element = element.data;
            }
            return /* @__PURE__ */ jsx(
              TabsTrigger,
              {
                value: tabKey,
                onClick: () => {
                  handleChange(tabKey);
                },
                children: data.label
              }
            );
          }),
          this.context.designerMode && !this.props.asChild && this.context.design ? /* @__PURE__ */ jsx(
            Button,
            {
              variant: "secondary",
              onClick: (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.addTab();
              },
              children: /* @__PURE__ */ jsx(Plus, { className: "pr-1" })
            }
          ) : null
        ] }),
        ...elementsDict.map((element, index) => {
          const data = (element.props ? element.props.data : element.data) || {};
          const tabKey = data.key || element.key;
          return /* @__PURE__ */ jsx(
            TabsContent,
            {
              value: tabKey,
              children: /* @__PURE__ */ jsx(
                DynamicComponent,
                {
                  wrapper: Tab,
                  elements: [
                    {
                      element: "tab",
                      data: {
                        name: tabKey,
                        id: tabKey,
                        label: element.data.label,
                        droppable: true,
                        draggable: false,
                        key: tabKey
                      },
                      children: element.content,
                      elements: element.elements || []
                    }
                  ],
                  parent: this,
                  ref: (self) => {
                    if (self)
                      self.parentComponent = designerRef;
                  }
                },
                tabKey
              )
            }
          );
        })
      ] })
    ] });
  }
}
__publicField(Tabs, "contextType", DesignerContext);
/*<Tab
              data={element.data}
              elements={element.elements}
              key={tabKey}
              ref={tab => {
                if (tab) {
                  this[tabKey] = tab;
                  if (this.props.designer) {
                    tab.parentComponent = this;
                  }
                }
              }}
            >{element.content}</Tab>*/
__publicField(Tabs, "TabItem", (props) => {
  return /* @__PURE__ */ jsx(
    TabsContent,
    {
      value: props.value,
      ...props,
      children: /* @__PURE__ */ jsx(Tab, { children: props.children })
    }
  );
});
class Tab extends Component {
  constructor(props) {
    super(props);
  }
  ///remove() {
  //    this.props.parentElement.removeTab(this.props.data.key);
  //}
  setData(data) {
    super.setData(data);
    this.props.parentElement.updateTab(this.props.data.key, data);
  }
  render() {
    return /* @__PURE__ */ jsxs(
      Droppable,
      {
        receiver: this,
        children: [
          this.props.children,
          this.elements
        ]
      }
    );
  }
}
export {
  Tabs as default
};
