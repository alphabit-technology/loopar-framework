var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { b as buttonVariants, h as http } from "../entry-server.js";
import BaseWorkspace from "./base-workspace-fAyqh84Y.js";
import { f as fileManager } from "./file-manager-elzUYIBp.js";
import Link from "./link-w8K-UYiW.js";
import { u as useWorkspace } from "./workspace-provider-ZZuPyRcj.js";
import { C as ChevronLeft } from "./chevron-left-fnrBQ1gk.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { G as Globe2 } from "./globe-2-q99urLW1.js";
import { C as Code2 } from "./code-2-FyQB0-ma.js";
import "react";
import { X } from "./x-3j0F7ehT.js";
import { M as Menu } from "./menu-VqBr40u5.js";
import { D as DropdownMenu, a as DropdownMenuTrigger, b as DropdownMenuContent, T as ThemeToggle } from "./theme-toggle-lqWonWWf.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./dialog-nmg_tOQf.js";
import "./dialog-9N_htvR6.js";
import "@radix-ui/react-dialog";
import "./input-LY3ihqM_.js";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "sonner";
import "next-themes";
import "./element-manage-OWCB4Xyr.js";
import "@radix-ui/react-dropdown-menu";
import "./chevron-right-1anJVGLe.js";
import "./check-siG4PdgZ.js";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const CircuitBoard = createLucideIcon("CircuitBoard", [
  ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", key: "afitv7" }],
  ["path", { d: "M11 9h4a2 2 0 0 0 2-2V3", key: "1ve2rv" }],
  ["circle", { cx: "9", cy: "9", r: "2", key: "af1f0g" }],
  ["path", { d: "M7 21v-4a2 2 0 0 1 2-2h4", key: "1fwkro" }],
  ["circle", { cx: "15", cy: "15", r: "2", key: "3i40o0" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Component = createLucideIcon("Component", [
  ["path", { d: "M5.5 8.5 9 12l-3.5 3.5L2 12l3.5-3.5Z", key: "1kciei" }],
  ["path", { d: "m12 2 3.5 3.5L12 9 8.5 5.5 12 2Z", key: "1ome0g" }],
  ["path", { d: "M18.5 8.5 22 12l-3.5 3.5L15 12l3.5-3.5Z", key: "vbupec" }],
  ["path", { d: "m12 15 3.5 3.5L12 22l-3.5-3.5L12 15Z", key: "16csic" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileArchive = createLucideIcon("FileArchive", [
  [
    "path",
    {
      d: "M4 22V4c0-.5.2-1 .6-1.4C5 2.2 5.5 2 6 2h8.5L20 7.5V20c0 .5-.2 1-.6 1.4-.4.4-.9.6-1.4.6h-2",
      key: "1u864v"
    }
  ],
  ["polyline", { points: "14 2 14 8 20 8", key: "1ew0cm" }],
  ["circle", { cx: "10", cy: "20", r: "2", key: "1xzdoj" }],
  ["path", { d: "M10 7V6", key: "dljcrl" }],
  ["path", { d: "M10 12v-1", key: "v7bkov" }],
  ["path", { d: "M10 18v-2", key: "1cjy8d" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const FileJson2 = createLucideIcon("FileJson2", [
  ["path", { d: "M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4", key: "702lig" }],
  ["polyline", { points: "14 2 14 8 20 8", key: "1ew0cm" }],
  [
    "path",
    { d: "M4 12a1 1 0 0 0-1 1v1a1 1 0 0 1-1 1 1 1 0 0 1 1 1v1a1 1 0 0 0 1 1", key: "fq0c9t" }
  ],
  [
    "path",
    { d: "M8 18a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1 1 1 0 0 1-1-1v-1a1 1 0 0 0-1-1", key: "4gibmv" }
  ]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const LayoutGrid = createLucideIcon("LayoutGrid", [
  ["rect", { width: "7", height: "7", x: "3", y: "3", rx: "1", key: "1g98yp" }],
  ["rect", { width: "7", height: "7", x: "14", y: "3", rx: "1", key: "6d4xhi" }],
  ["rect", { width: "7", height: "7", x: "14", y: "14", rx: "1", key: "nxv5o0" }],
  ["rect", { width: "7", height: "7", x: "3", y: "14", rx: "1", key: "1bb6yr" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Settings2 = createLucideIcon("Settings2", [
  ["path", { d: "M20 7h-9", key: "3s1dr2" }],
  ["path", { d: "M14 17H5", key: "gfn3mx" }],
  ["circle", { cx: "17", cy: "17", r: "3", key: "18b49y" }],
  ["circle", { cx: "7", cy: "7", r: "3", key: "dfmy0x" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Sliders = createLucideIcon("Sliders", [
  ["line", { x1: "4", x2: "4", y1: "21", y2: "14", key: "1p332r" }],
  ["line", { x1: "4", x2: "4", y1: "10", y2: "3", key: "gb41h5" }],
  ["line", { x1: "12", x2: "12", y1: "21", y2: "12", key: "hf2csr" }],
  ["line", { x1: "12", x2: "12", y1: "8", y2: "3", key: "1kfi7u" }],
  ["line", { x1: "20", x2: "20", y1: "21", y2: "16", key: "1lhrwl" }],
  ["line", { x1: "20", x2: "20", y1: "12", y2: "3", key: "16vvfq" }],
  ["line", { x1: "2", x2: "6", y1: "14", y2: "14", key: "1uebub" }],
  ["line", { x1: "10", x2: "14", y1: "8", y2: "8", key: "1yglbp" }],
  ["line", { x1: "18", x2: "22", y1: "16", y2: "16", key: "1jxqpz" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const UserRound = createLucideIcon("UserRound", [
  ["circle", { cx: "12", cy: "8", r: "5", key: "1hypcn" }],
  ["path", { d: "M20 21a8 8 0 0 0-16 0", key: "rfgkzh" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Users = createLucideIcon("Users", [
  ["path", { d: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", key: "1yyitq" }],
  ["circle", { cx: "9", cy: "7", r: "4", key: "nufk8" }],
  ["path", { d: "M22 21v-2a4 4 0 0 0-3-3.87", key: "kshegd" }],
  ["path", { d: "M16 3.13a4 4 0 0 1 0 7.75", key: "1da9ce" }]
]);
const SideNavItem = (props) => {
  const {
    active = false,
    external,
    Icon,
    path,
    title,
    compact
  } = props;
  const linkProps = path ? external : {};
  const { collapseSidebarWidth } = useWorkspace();
  const link = compact ? /* @__PURE__ */ jsxs(
    Link,
    {
      to: `/desk/${path}`,
      className: `transition-duration-100 h-13 flex w-full flex-col justify-start space-y-0 rounded-full text-left align-middle transition-all ${props.className || ""}`,
      children: [
        Icon && /* @__PURE__ */ jsx(Icon, { className: "h-7" }),
        title && title.split(" ").map((word, index) => /* @__PURE__ */ jsx(
          "small",
          {
            className: "truncate text-center",
            style: { maxWidth: collapseSidebarWidth - 10 },
            children: word
          },
          index
        ))
      ]
    }
  ) : null;
  return compact ? link : /* @__PURE__ */ jsx(
    Link,
    {
      className: `${active ? "text-primary" : module.disabled ? "text-disabled" : "text-neutral-400"}
                      grow whitespace-nowrap px-0 font-sans text-[14px] font-semibold leading-6 no-underline `,
      href: `/desk/${path}`,
      children: /* @__PURE__ */ jsxs(
        "button",
        {
          className: `flex w-full justify-start rounded bg-slate-100/50 px-4 py-1 text-left align-middle dark:bg-slate-700/30 ${props.className || ""}`,
          ...linkProps,
          children: [
            Icon && /* @__PURE__ */ jsx(Icon, { className: "mr-2" }),
            title
          ]
        }
      )
    }
  );
};
const icons = {
  "fa fa-cog": Settings2,
  "fa fa-user": Users,
  "fa fa-tools": Sliders,
  "fa fa-globe": Globe2,
  "fa fa-oi-fork": Code2
};
function SideNav({ items }) {
  const { sidebarWidth, collapseSidebarWidth, screenSize, openNav, setOpenNav, toogleSidebarNav } = useWorkspace();
  const baseStyle = {
    ...screenSize === "lg" ? { top: 65 } : {},
    width: openNav ? sidebarWidth : screenSize === "lg" ? collapseSidebarWidth : 0
  };
  const content = items.map((item, i) => {
    const { description, href, modules = [] } = item;
    const hasSubitems = modules && modules.length > 0;
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", (e) => {
        if (e.ctrlKey && e.key === "k") {
          toogleSidebarNav();
        }
        if (e.key === "Escape") {
          setOpenNav();
        }
      });
    }
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        "h5",
        {
          className: "mb-1 mt-3 font-semibold text-slate-900 dark:text-slate-200",
          children: openNav && description
        }
      ),
      /* @__PURE__ */ jsx("div", { children: hasSubitems && /* @__PURE__ */ jsxs("ul", { className: "flex flex-col gap-1 px-1", children: [
        ...modules.map((module2) => {
          const active = module2.link ? true : false;
          return /* @__PURE__ */ jsx(
            SideNavItem,
            {
              active,
              disabled: module2.disabled,
              external: module2.external,
              Icon: icons[module2.icon] || ChevronLeft,
              path: module2.link,
              title: module2.description,
              compact: !openNav,
              className: "rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
            },
            module2.description
          );
        })
      ] }) }, i)
    ] });
  });
  const sidebarClass = screenSize === "lg" ? "" : "bg-popover/90";
  return /* @__PURE__ */ jsx(Fragment, { children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: `fixed inset-0 z-50 overflow-y-auto duration-100 ease-in ${sidebarClass} border-r`,
      style: baseStyle,
      children: [
        screenSize !== "lg" && openNav && /* @__PURE__ */ jsx(
          "div",
          {
            className: "fixed inset-0 backdrop-blur-sm",
            "area-hidden": true,
            "data-headlessui-state": true,
            onClick: () => setOpenNav(false)
          }
        ),
        /* @__PURE__ */ jsxs(
          "div",
          {
            className: `${openNav ? "p-2" : "p-0"}`,
            style: { width: openNav ? sidebarWidth : collapseSidebarWidth },
            children: [
              openNav && screenSize != "lg" && /* @__PURE__ */ jsxs(
                "button",
                {
                  type: "button",
                  className: "absolute right-5 top-1 z-10 flex h-8 w-8 items-center justify-center text-slate-500 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-300",
                  "tab-index": "0",
                  onClick: () => setOpenNav(false),
                  children: [
                    /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Close navigation" }),
                    /* @__PURE__ */ jsx("svg", { viewBox: "0 0 10 10", className: "h-2.5 w-2.5 overflow-visible", children: /* @__PURE__ */ jsx("path", { d: "M0 0L10 10M10 0L0 10", fill: "none", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round" }) })
                  ]
                }
              ),
              /* @__PURE__ */ jsxs("div", { className: "relative lg:text-sm lg:leading-6", children: [
                openNav && /* @__PURE__ */ jsx("div", { className: "pointer-events-none sticky top-0 -ml-0.5", children: /* @__PURE__ */ jsx("div", { className: "pointer-events-auto relative bg-white dark:bg-slate-900", children: /* @__PURE__ */ jsxs("button", { type: "button", className: "dark:highlight-white/5 hidden w-full items-center rounded-md py-1.5 pl-2 pr-3 text-sm leading-6 text-slate-400 shadow-sm ring-1 ring-slate-900/10 hover:ring-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 lg:flex", children: [
                  /* @__PURE__ */ jsxs("svg", { width: "24", height: "24", fill: "none", "aria-hidden": "true", className: "mr-3 flex-none", children: [
                    /* @__PURE__ */ jsx("path", { d: "m19 19-3.5-3.5", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" }),
                    /* @__PURE__ */ jsx("circle", { cx: "11", cy: "11", r: "6", stroke: "currentColor", "stroke-width": "2", "stroke-linecap": "round", "stroke-linejoin": "round" })
                  ] }),
                  "Quick search...",
                  /* @__PURE__ */ jsx("span", { className: "ml-auto flex-none pl-3 text-xs font-semibold", children: "Ctrl K" })
                ] }) }) }),
                /* @__PURE__ */ jsx("ul", { children: content })
              ] })
            ]
          }
        )
      ]
    }
  ) });
}
const DeskLogo = (props) => {
  const imageProps = {
    src: `/assets/images/logo.svg`,
    alt: "Loopar Logo",
    className: "hidden h-8 md:block",
    href: "/core/Desk/view"
  };
  return /* @__PURE__ */ jsx("div", { className: "p-1", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "inline-flex items-center",
      children: [
        /* @__PURE__ */ jsx("img", { ...imageProps }),
        /* @__PURE__ */ jsx("img", { ...imageProps, src: "/assets/images/logo-dark-min.svg", className: "h-8 w-20 md:hidden", style: { minWidth: 40, maxWidth: 40 } })
      ]
    }
  ) });
};
function MainNav() {
  const { openNav, setOpenNav } = useWorkspace();
  const Icon = openNav ? X : Menu;
  return /* @__PURE__ */ jsxs("div", { className: "flex", children: [
    /* @__PURE__ */ jsx(
      "button",
      {
        onClick: () => {
          setOpenNav(!openNav);
        },
        className: "text-gray-700",
        children: /* @__PURE__ */ jsx(Icon, { className: "h-11 w-11 fill-current" })
      }
    ),
    /* @__PURE__ */ jsx(DeskLogo, {})
  ] });
}
const MakeButton = ({ Icon, text, link }) => /* @__PURE__ */ jsxs(
  Link,
  {
    to: link,
    variant: "ghost",
    children: [
      /* @__PURE__ */ jsx(Icon, { className: "h-7 w-7 mr-2" }),
      text
    ]
  }
);
function AppsMenu() {
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      "div",
      {
        className: `${buttonVariants({
          size: "icon",
          variant: "ghost"
        })} cursor-pointer`,
        children: [
          /* @__PURE__ */ jsx(LayoutGrid, {}),
          /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Home" })
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(DropdownMenuContent, { align: "end", children: /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 p-2", children: [
      /* @__PURE__ */ jsx(MakeButton, { Icon: FileJson2, text: "Documents", link: "/desk/core/Document/list" }),
      /* @__PURE__ */ jsx(MakeButton, { Icon: Component, text: "Modules", link: "/desk/core/Module/list" }),
      /* @__PURE__ */ jsx(MakeButton, { Icon: CircuitBoard, text: "Apps", link: "/desk/developer/App Manager/view" }),
      /* @__PURE__ */ jsx(MakeButton, { Icon: FileArchive, text: "Files", link: "/desk/core/File Manager/list" }),
      /* @__PURE__ */ jsx(MakeButton, { Icon: Settings2, text: "Settings", link: "/desk/core/System Settings/update" }),
      /* @__PURE__ */ jsx(MakeButton, { Icon: UserRound, text: "Users", link: "/desk/auth/user/list" })
    ] }) })
  ] });
}
function TopNav() {
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs("div", { className: "container flex h-16 items-center space-x-4 px-2 sm:justify-between sm:space-x-0", children: [
    /* @__PURE__ */ jsx(MainNav, {}),
    /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-center justify-end space-x-4", children: /* @__PURE__ */ jsxs("nav", { className: "flex items-center space-x-1", children: [
      /* @__PURE__ */ jsx(AppsMenu, {}),
      /* @__PURE__ */ jsx(ThemeToggle, {})
    ] }) })
  ] }) });
}
const Layout = (props) => {
  const { sidebarWidth, collapseSidebarWidth, screenSize, headerHeight, openNav } = useWorkspace();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(TopNav, { openNav, height: headerHeight }),
    /* @__PURE__ */ jsxs("section", { style: { minHeight: `calc(100vh - ${headerHeight}px)` }, className: "flex", children: [
      /* @__PURE__ */ jsx(
        SideNav,
        {
          items: props.menu_data
        }
      ),
      /* @__PURE__ */ jsx(
        "div",
        {
          className: `ease-induration-100 ml-4 w-full overflow-auto p-4 duration-100 ease-in`,
          style: { paddingLeft: openNav && screenSize === "lg" ? sidebarWidth : screenSize === "lg" ? collapseSidebarWidth : 0 },
          children: props.children
        }
      )
    ] })
  ] });
};
class DeskWorkspace extends BaseWorkspace {
  constructor(props) {
    super(props);
    __publicField(this, "sidebarWidth", 250);
    __publicField(this, "collapseSidebarWidth", 70);
    __publicField(this, "headerHeight", "2rem");
    this.state = {
      ...this.state,
      menu_data: props.menu_data || []
    };
  }
  menuItems() {
    const __META__ = this.props.__META__;
    return __META__.menu_data || [];
  }
  render() {
    const user = this.meta.user || {};
    fileManager.getImage(
      user,
      "profile_picture",
      "profile.png"
    );
    return super.render(
      /* @__PURE__ */ jsx(Layout, { ...this.props, menu_data: this.state.menu_data, children: super.documents })
    );
  }
  async refresh() {
    return new Promise((resolve) => {
      http.send({
        action: "/api/desk/sidebar",
        params: {},
        success: (r) => {
          var _a;
          if ((_a = r.meta) == null ? void 0 : _a.sidebarData) {
            this.state.menu_data = r.meta.sidebarData;
            resolve(r);
          }
        }
      });
    });
  }
}
export {
  DeskWorkspace as default
};
