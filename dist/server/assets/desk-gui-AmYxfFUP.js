import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { l as loopar, B as Button } from "../entry-server.js";
import Link from "./link-w8K-UYiW.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { C as ChevronRight } from "./chevron-right-1anJVGLe.js";
import { S as Separator } from "./form-z4zN6fsS.js";
import "./form-context-8n26Uc_0.js";
import { P as Plus } from "./plus-kMrZWx_A.js";
import { M as Menu } from "./menu-VqBr40u5.js";
import { X } from "./x-3j0F7ehT.js";
import { u as useWorkspace } from "./workspace-provider-ZZuPyRcj.js";
import { b as useDocument } from "./base-component-BnGRdg1n.js";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const ArrowBigRight = createLucideIcon("ArrowBigRight", [
  ["path", { d: "M6 9h6V5l7 7-7 7v-4H6V9z", key: "7fvt9c" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Grid3x3 = createLucideIcon("Grid3x3", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M3 9h18", key: "1pudct" }],
  ["path", { d: "M3 15h18", key: "5xshup" }],
  ["path", { d: "M9 3v18", key: "fh3hqa" }],
  ["path", { d: "M15 3v18", key: "14nvp0" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Home = createLucideIcon("Home", [
  ["path", { d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z", key: "y5dka4" }],
  ["polyline", { points: "9 22 9 12 15 12 15 22", key: "e2us08" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const MoreVertical = createLucideIcon("MoreVertical", [
  ["circle", { cx: "12", cy: "12", r: "1", key: "41hilf" }],
  ["circle", { cx: "12", cy: "5", r: "1", key: "gxeob9" }],
  ["circle", { cx: "12", cy: "19", r: "1", key: "lyex9k" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Save = createLucideIcon("Save", [
  ["path", { d: "M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", key: "1owoqh" }],
  ["polyline", { points: "17 21 17 13 7 13 7 21", key: "1md35c" }],
  ["polyline", { points: "7 3 7 8 15 8", key: "8nz8an" }]
]);
function Breadcrumbs({ meta }) {
  let context = null;
  const makeLinks = () => {
    const dataLinks2 = [];
    if (meta.__DOCTYPE__.module) {
      const text = loopar.utils.Capitalize(
        meta.__DOCTYPE__.module
      );
      const link = `/${meta.__DOCTYPE__.module}`;
      dataLinks2.push({ text, link, has_icon: true });
    }
    if (meta.__DOCTYPE__.name && context !== "module" && !meta.__DOCTYPE__.is_single) {
      dataLinks2.push({
        text: loopar.utils.Capitalize(meta.__DOCTYPE__.name),
        link: `/${meta.__DOCTYPE__.module}/${meta.__DOCTYPE__.name}/list`,
        has_icon: false
      });
    }
    if (meta.action) {
      dataLinks2.push({
        text: meta.action,
        to: null,
        has_icon: false
      });
    }
    return dataLinks2;
  };
  const dataLinks = makeLinks();
  const getItem = (link, index, attrs = {}) => /* @__PURE__ */ jsx("li", { class: "inline-flex items-center", ...attrs, children: /* @__PURE__ */ jsxs(
    Link,
    {
      variant: "link",
      className: "px-0",
      ...link.link ? { to: `/desk${link.link}` } : {},
      children: [
        index === 0 ? /* @__PURE__ */ jsx(Home, { className: "h-4" }) : /* @__PURE__ */ jsx(ChevronRight, {}),
        index === 0 ? loopar.utils.UPPERCASE(link.text) : link.text
      ]
    }
  ) });
  return /* @__PURE__ */ jsx("nav", { class: "flex", "aria-label": "Breadcrumb", className: "pb-1", children: /* @__PURE__ */ jsx("ol", { class: "inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse", children: dataLinks.map((link, index) => {
    return getItem(link, index, index < dataLinks.length - 1 ? {} : { "aria-current": "page" });
  }) }) });
}
function AppBarr({ docRef, meta, sidebarOpen, toggleSidebar }) {
  const context = ["create", "update"].includes(meta.action) ? "form" : meta.action;
  const title = (meta.title || context === "module" ? meta.module_group : ["list", "view"].includes(context) || meta.action === "create" ? meta.__DOCTYPE__.name : meta.__DOCUMENT__.name) || meta.__DOCTYPE__.name;
  const SidebarIcon = sidebarOpen ? X : MoreVertical;
  const formPrimaryActions = () => {
    return docRef.canUpdate ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "secondary",
          tabIndex: "0",
          type: "submit",
          children: [
            /* @__PURE__ */ jsx(Save, { className: "pr-1" }),
            "Save"
          ]
        }
      ),
      meta.__IS_NEW__ ? null : meta.__DOCTYPE__.name === "Document" ? /* @__PURE__ */ jsx(
        Link,
        {
          variant: "secondary",
          to: `/desk/${meta.__DOCUMENT__.module}/${meta.__DOCUMENT__.name}/${meta.__DOCUMENT__.is_single ? "update" : "list"}`,
          children: /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ArrowBigRight, { className: "pr-1" }),
            "Go to ",
            loopar.utils.Capitalize(meta.__DOCUMENT__.name)
          ] })
        }
      ) : null
    ] }) : [];
  };
  const listPrimaryActions = () => {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      context === "list" ? /* @__PURE__ */ jsxs(Fragment, { children: [
        docRef.primaryAction ? docRef.primaryAction() : /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "secondary",
            tabIndex: "0",
            type: "button",
            onClick: () => {
              loopar.navigate("create");
            },
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "pr-1" }),
              "New"
            ]
          }
        ),
        docRef.onlyGrid !== true && /* @__PURE__ */ jsx(
          Button,
          {
            className: "p-1",
            variant: "secondary",
            onClick: () => {
              console.log(["viewType............", docRef.state.viewType]);
              const viewType = docRef.state.viewType === "List" ? "Grid" : "List";
              loopar.utils.cookie.set(meta.__DOCTYPE__.name + "_viewType", viewType);
              docRef.setState({ viewType });
            },
            children: docRef.state.viewType === "List" ? /* @__PURE__ */ jsx(Grid3x3, {}) : /* @__PURE__ */ jsx(Menu, {})
          }
        )
      ] }) : null,
      docRef.hasSidebar ? /* @__PURE__ */ jsx(
        Button,
        {
          className: "p-2",
          variant: "secondary",
          tabIndex: "0",
          type: "button",
          onClick: toggleSidebar,
          children: /* @__PURE__ */ jsx(SidebarIcon, { className: "pr-1" })
        }
      ) : null
    ] });
  };
  const customActions = docRef.customActions || {};
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex w-full flex-row justify-between pb-3 pr-1", children: [
      /* @__PURE__ */ jsxs("div", { className: "gap-1", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-4xl font-bold", children: title }),
        /* @__PURE__ */ jsx("div", { className: "flex flex-row items-center gap-1", children: /* @__PURE__ */ jsx(Breadcrumbs, { meta }) })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-row space-x-1", children: [
        Object.values(customActions),
        formPrimaryActions(),
        listPrimaryActions()
      ] })
    ] }),
    /* @__PURE__ */ jsx(Separator, { className: "mb-5" })
  ] });
}
const sidebarWidth = 280;
const InnerSidebar = ({ toggleSidebar, ...props }) => {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed right-0 h-full z-10 p-2 border-l bg-background shadow-lg transition-all",
      style: { top: "4rem", height: "calc(100% - 4rem)", width: 280, transition: "width 0.2s" },
      children: [
        /* @__PURE__ */ jsx("div", { className: "flex flex-col w-full", children: /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "absolute right-2 top-1 z-10 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300",
            "tab-index": "0",
            onClick: toggleSidebar,
            children: [
              /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close navigation" }),
              /* @__PURE__ */ jsx("svg", { viewBox: "0 0 10 10", className: "h-2.5 w-2.5 overflow-visible", children: /* @__PURE__ */ jsx("path", { d: "M0 0L10 10M10 0L0 10", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round" }) })
            ]
          }
        ) }) }),
        props.children
      ]
    }
  );
};
function DeskGUI(props) {
  const docRef = props.docRef;
  const document = useDocument();
  const { screenSize } = useWorkspace();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  useEffect(
    () => {
      !sidebarOpen && setSidebarOpen(document.mode === "editor" || document.mode === "designer");
    },
    [document.mode, document.editElement]
  );
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-row", children: [
    /* @__PURE__ */ jsxs(
      "div",
      {
        style: { width: screenSize !== "lg" ? "100%" : sidebarOpen ? `calc(100% - ${sidebarWidth}px)` : "100%" },
        children: [
          docRef.hasHeader && /* @__PURE__ */ jsx(
            AppBarr,
            {
              docRef,
              meta: docRef.meta,
              toggleSidebar,
              sidebarOpen
            }
          ),
          props.children
        ]
      }
    ),
    sidebarOpen && /* @__PURE__ */ jsx(
      InnerSidebar,
      {
        toggleSidebar,
        children: docRef.sidebar
      }
    )
  ] }) });
}
export {
  DeskGUI as D
};
