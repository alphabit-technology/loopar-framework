var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import "react";
import BaseWorkspace from "./base-workspace-fAyqh84Y.js";
import { b as buttonVariants, l as loopar } from "../entry-server.js";
import Link from "./link-w8K-UYiW.js";
import { marked } from "marked";
import { u as useWorkspace } from "./workspace-provider-ZZuPyRcj.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { M as Moon, T as ThemeToggle } from "./theme-toggle-lqWonWWf.js";
import { X } from "./x-3j0F7ehT.js";
import { M as Menu } from "./menu-VqBr40u5.js";
import "./dialog-nmg_tOQf.js";
import "./dialog-9N_htvR6.js";
import "@radix-ui/react-dialog";
import "./input-LY3ihqM_.js";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "class-variance-authority";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "universal-cookie";
import "sonner";
import "next-themes";
import "@radix-ui/react-dropdown-menu";
import "./chevron-right-1anJVGLe.js";
import "./check-siG4PdgZ.js";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const SunMedium = createLucideIcon("SunMedium", [
  ["circle", { cx: "12", cy: "12", r: "4", key: "4exip2" }],
  ["path", { d: "M12 3v1", key: "1asbbs" }],
  ["path", { d: "M12 20v1", key: "1wcdkc" }],
  ["path", { d: "M3 12h1", key: "lp3yf2" }],
  ["path", { d: "M20 12h1", key: "1vloll" }],
  ["path", { d: "m18.364 5.636-.707.707", key: "1hakh0" }],
  ["path", { d: "m6.343 17.657-.707.707", key: "18m9nf" }],
  ["path", { d: "m5.636 5.636.707.707", key: "1xv1c5" }],
  ["path", { d: "m17.657 17.657.707.707", key: "vl76zb" }]
]);
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Twitter = createLucideIcon("Twitter", [
  [
    "path",
    {
      d: "M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z",
      key: "pff0z6"
    }
  ]
]);
const SideNavItem = (props) => {
  const {
    Icon,
    path,
    title
  } = props;
  const linkProps = path ? external : {};
  return /* @__PURE__ */ jsx(
    Link,
    {
      className: "text-primary text-neutral-400 grow whitespace-nowrap px-0 font-sans text-[14px] font-semibold leading-6 no-underline",
      to: `/${path}`,
      children: /* @__PURE__ */ jsxs(
        "button",
        {
          className: `transition-colors hover:text-foreground/80 text-foreground/60`,
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
function SideNav() {
  const { sidebarWidth, collapseSidebarWidth, screenSize, openNav, setOpenNav, toogleSidebarNav, menuItems } = useWorkspace();
  const baseStyle = {
    ...screenSize === "lg" ? { top: 65 } : {},
    width: openNav ? sidebarWidth : screenSize === "lg" ? collapseSidebarWidth : 0
  };
  const content = menuItems.map((item, i) => {
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
    return /* @__PURE__ */ jsx(
      SideNavItem,
      {
        path: item.link,
        title: item.page,
        className: "rounded-md py-2 hover:bg-slate-300/50 dark:hover:bg-slate-700/80"
      }
    );
  });
  const sidebarClass = screenSize === "lg" ? "" : "bg-popover/90";
  if (screenSize === "lg")
    return null;
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
                /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-2 p-3 pt-5", children: content })
              ] })
            ]
          }
        )
      ]
    }
  ) });
}
const Icons = {
  sun: SunMedium,
  moon: Moon,
  twitter: Twitter,
  home: (props) => /* @__PURE__ */ jsx(
    "svg",
    {
      xmlns: "http://www.w3.org/2000/svg",
      viewBox: "0 0 24 24",
      fill: "currentColor",
      ...props,
      children: /* @__PURE__ */ jsx("path", { d: "M12 0l12 24H0z" })
    }
  ),
  logo: (props) => /* @__PURE__ */ jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      fill: "currentColor",
      d: "M11.572 0c-.176 0-.31.001-.358.007a19.76 19.76 0 0 1-.364.033C7.443.346 4.25 2.185 2.228 5.012a11.875 11.875 0 0 0-2.119 5.243c-.096.659-.108.854-.108 1.747s.012 1.089.108 1.748c.652 4.506 3.86 8.292 8.209 9.695.779.25 1.6.422 2.534.525.363.04 1.935.04 2.299 0 1.611-.178 2.977-.577 4.323-1.264.207-.106.247-.134.219-.158-.02-.013-.9-1.193-1.955-2.62l-1.919-2.592-2.404-3.558a338.739 338.739 0 0 0-2.422-3.556c-.009-.002-.018 1.579-.023 3.51-.007 3.38-.01 3.515-.052 3.595a.426.426 0 0 1-.206.214c-.075.037-.14.044-.495.044H7.81l-.108-.068a.438.438 0 0 1-.157-.171l-.05-.106.006-4.703.007-4.705.072-.092a.645.645 0 0 1 .174-.143c.096-.047.134-.051.54-.051.478 0 .558.018.682.154.035.038 1.337 1.999 2.895 4.361a10760.433 10760.433 0 0 0 4.735 7.17l1.9 2.879.096-.063a12.317 12.317 0 0 0 2.466-2.163 11.944 11.944 0 0 0 2.824-6.134c.096-.66.108-.854.108-1.748 0-.893-.012-1.088-.108-1.747-.652-4.506-3.859-8.292-8.208-9.695a12.597 12.597 0 0 0-2.499-.523A33.119 33.119 0 0 0 11.573 0zm4.069 7.217c.347 0 .408.005.486.047a.473.473 0 0 1 .237.277c.018.06.023 1.365.018 4.304l-.006 4.218-.744-1.14-.746-1.14v-3.066c0-1.982.01-3.097.023-3.15a.478.478 0 0 1 .233-.296c.096-.05.13-.054.5-.054z"
    }
  ) }),
  gitHub: (props) => /* @__PURE__ */ jsx("svg", { viewBox: "0 0 438.549 438.549", ...props, children: /* @__PURE__ */ jsx(
    "path",
    {
      fill: "currentColor",
      d: "M409.132 114.573c-19.608-33.596-46.205-60.194-79.798-79.8-33.598-19.607-70.277-29.408-110.063-29.408-39.781 0-76.472 9.804-110.063 29.408-33.596 19.605-60.192 46.204-79.8 79.8C9.803 148.168 0 184.854 0 224.63c0 47.78 13.94 90.745 41.827 128.906 27.884 38.164 63.906 64.572 108.063 79.227 5.14.954 8.945.283 11.419-1.996 2.475-2.282 3.711-5.14 3.711-8.562 0-.571-.049-5.708-.144-15.417a2549.81 2549.81 0 01-.144-25.406l-6.567 1.136c-4.187.767-9.469 1.092-15.846 1-6.374-.089-12.991-.757-19.842-1.999-6.854-1.231-13.229-4.086-19.13-8.559-5.898-4.473-10.085-10.328-12.56-17.556l-2.855-6.57c-1.903-4.374-4.899-9.233-8.992-14.559-4.093-5.331-8.232-8.945-12.419-10.848l-1.999-1.431c-1.332-.951-2.568-2.098-3.711-3.429-1.142-1.331-1.997-2.663-2.568-3.997-.572-1.335-.098-2.43 1.427-3.289 1.525-.859 4.281-1.276 8.28-1.276l5.708.853c3.807.763 8.516 3.042 14.133 6.851 5.614 3.806 10.229 8.754 13.846 14.842 4.38 7.806 9.657 13.754 15.846 17.847 6.184 4.093 12.419 6.136 18.699 6.136 6.28 0 11.704-.476 16.274-1.423 4.565-.952 8.848-2.383 12.847-4.285 1.713-12.758 6.377-22.559 13.988-29.41-10.848-1.14-20.601-2.857-29.264-5.14-8.658-2.286-17.605-5.996-26.835-11.14-9.235-5.137-16.896-11.516-22.985-19.126-6.09-7.614-11.088-17.61-14.987-29.979-3.901-12.374-5.852-26.648-5.852-42.826 0-23.035 7.52-42.637 22.557-58.817-7.044-17.318-6.379-36.732 1.997-58.24 5.52-1.715 13.706-.428 24.554 3.853 10.85 4.283 18.794 7.952 23.84 10.994 5.046 3.041 9.089 5.618 12.135 7.708 17.705-4.947 35.976-7.421 54.818-7.421s37.117 2.474 54.823 7.421l10.849-6.849c7.419-4.57 16.18-8.758 26.262-12.565 10.088-3.805 17.802-4.853 23.134-3.138 8.562 21.509 9.325 40.922 2.279 58.24 15.036 16.18 22.559 35.787 22.559 58.817 0 16.178-1.958 30.497-5.853 42.966-3.9 12.471-8.941 22.457-15.125 29.979-6.191 7.521-13.901 13.85-23.131 18.986-9.232 5.14-18.182 8.85-26.84 11.136-8.662 2.286-18.415 4.004-29.263 5.146 9.894 8.562 14.842 22.077 14.842 40.539v60.237c0 3.422 1.19 6.279 3.572 8.562 2.379 2.279 6.136 2.95 11.276 1.995 44.163-14.653 80.185-41.062 108.068-79.226 27.88-38.161 41.825-81.126 41.825-128.906-.01-39.771-9.818-76.454-29.414-110.049z"
    }
  ) })
};
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
  const { openNav, setOpenNav, menuItems, device } = useWorkspace();
  const Icon = openNav ? X : Menu;
  const desktop = device === "desktop";
  const Items = menuItems.map((item, i) => /* @__PURE__ */ jsx(
    Link,
    {
      className: "transition-colors hover:text-foreground/80 text-foreground/60",
      to: `/${item.link}`,
      children: item.page
    },
    item.id + i
  ));
  const handleSetOpenNav = (e) => {
    setOpenNav(!openNav);
  };
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex", children: [
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleSetOpenNav,
          className: "text-gray-700 lg:hidden",
          children: /* @__PURE__ */ jsx(Icon, { className: "h-11 w-11 fill-current" })
        }
      ),
      /* @__PURE__ */ jsx(DeskLogo, {})
    ] }),
    desktop && /* @__PURE__ */ jsx("div", { className: "flex items-center text-sm", children: Items })
  ] });
}
function TopNav() {
  const { headerHeight } = useWorkspace();
  return /* @__PURE__ */ jsx("header", { className: "sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-sm", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: "container flex h-16 items-center space-x-4 px-2 sm:justify-between sm:space-x-0",
      style: { height: headerHeight },
      children: [
        /* @__PURE__ */ jsx(MainNav, {}),
        /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-center justify-end space-x-4", children: /* @__PURE__ */ jsxs("nav", { className: "flex items-center space-x-1", children: [
          /* @__PURE__ */ jsx(
            "a",
            {
              href: "https://twitter.com/looparinc",
              target: "_blank",
              rel: "noreferrer",
              children: /* @__PURE__ */ jsxs(
                "div",
                {
                  className: buttonVariants({
                    size: "icon",
                    variant: "ghost"
                  }),
                  children: [
                    /* @__PURE__ */ jsx(Icons.twitter, { className: "h-5 w-5 fill-current" }),
                    /* @__PURE__ */ jsx("span", { className: "sr-only", children: "Twitter" })
                  ]
                }
              )
            }
          ),
          /* @__PURE__ */ jsx(ThemeToggle, {})
        ] }) })
      ]
    }
  ) });
}
const Layout = ({ webApp, ...props }) => {
  const { headerHeight } = useWorkspace();
  return /* @__PURE__ */ jsxs("div", { className: "vaul-drawer-wrapper", children: [
    /* @__PURE__ */ jsx(TopNav, {}),
    /* @__PURE__ */ jsxs(
      "section",
      {
        style: { minHeight: `calc(100vh - ${headerHeight})` },
        className: "flex",
        children: [
          /* @__PURE__ */ jsx(SideNav, {}),
          /* @__PURE__ */ jsx(
            "div",
            {
              className: `ease-induration-100 w-full overflow-auto duration-100 ease-in`,
              children: props.children
            }
          )
        ]
      }
    ),
    /* @__PURE__ */ jsx("footer", { className: "py-6 md:px-8 md:py-0 border-t", children: /* @__PURE__ */ jsxs("div", { className: "container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row", children: [
      webApp.has_footer ? /* @__PURE__ */ jsx("div", { className: "", children: /* @__PURE__ */ jsx("div", { dangerouslySetInnerHTML: { __html: marked.parse(webApp.footer || "") } }) }) : null,
      webApp.has_copyright ? /* @__PURE__ */ jsxs("div", { className: "", children: [
        /* @__PURE__ */ jsx("hr", { className: "my-4" }),
        /* @__PURE__ */ jsx("div", { dangerouslySetInnerHTML: { __html: marked.parse(webApp.copyright || "") } })
      ] }) : null
    ] }) })
  ] });
};
class WebWorkspace extends BaseWorkspace {
  constructor(props) {
    super(props);
    __publicField(this, "headerHeight", "5rem");
    __publicField(this, "sidebarWidth", 250);
    __publicField(this, "collapseSidebarWidth", 0);
  }
  /**render(){
  	 return super.render(
  			<h1>Web Workspace</h1>
  	 )
  }*/
  menuItems() {
    const app = this.webApp();
    return app.menu_items.rows;
  }
  webApp() {
    const __META__ = this.props.__META__;
    const workspace = JSON.parse(__META__.workspace);
    return workspace.web_app.__DOCUMENT__ || {};
  }
  render() {
    const meta = this.meta || {};
    const webApp = meta.web_app.__DOCUMENT__;
    return super.render(
      /* @__PURE__ */ jsx(Layout, { ...this.props, webApp, children: super.documents })
    );
  }
  getMenuItems(menuItems) {
    return menuItems.map((item) => {
      const active = item.page === loopar.currentPageName;
      return /* @__PURE__ */ jsx("ul", { className: "menu", children: /* @__PURE__ */ jsx("li", { className: `menu-item ${active ? "active" : ""}`, ref: (self) => this[item.page] = self, children: /* @__PURE__ */ jsx(
        Link,
        {
          className: `menu-link py-2`,
          href: item.page,
          children: item.link
        }
      ) }) }, loopar.currentPageName);
    });
  }
  componentDidMount(prevProps, prevState, snapshot) {
    super.componentDidMount(prevProps, prevState, snapshot);
  }
}
export {
  WebWorkspace as default
};
