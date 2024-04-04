var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, jsx } from "react/jsx-runtime";
import DivComponent from "./div-rCeXGfsc.js";
import { B as Button } from "../entry-server.js";
import "react";
import "clsx";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "react-dom/server";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
class PaginationClass extends DivComponent {
  constructor() {
    super(...arguments);
    __publicField(this, "className", "row align-items-center aside-footer p-2");
    __publicField(this, "style", { width: "100%" });
  }
  get pagination() {
    return this.props.pagination;
  }
  getPages() {
    const { page, totalPages } = this.pagination;
    const maxPagesToShow = 5;
    const pages = [];
    if (totalPages <= maxPagesToShow) {
      return new Array(totalPages).fill().map((_, i) => i + 1);
    } else {
      const halfMaxPagesToShow = Math.floor(maxPagesToShow / 2);
      let startPage = page - halfMaxPagesToShow;
      let endPage = page + halfMaxPagesToShow;
      if (startPage <= 0) {
        endPage = maxPagesToShow;
        startPage = 1;
      } else if (endPage > totalPages) {
        endPage = totalPages;
        startPage = totalPages - maxPagesToShow + 1;
      }
      if (startPage > 1) {
        pages.push(1);
        startPage > 2 && pages.push("...");
      }
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
      if (endPage < totalPages) {
        endPage < totalPages - 1 && pages.push("...");
        pages.push(totalPages);
      }
      return pages;
    }
  }
  render() {
    const { page, pageSize, totalRecords, totalPages } = this.pagination;
    const initial = (page - 1) * pageSize + 1;
    const final = page * pageSize > totalRecords ? totalRecords : page * pageSize;
    return /* @__PURE__ */ jsxs("div", { className: "flex-col-2 justify-content flex flex-row border bg-slate-100/80 py-2 pr-2 dark:bg-slate-900/60", children: [
      /* @__PURE__ */ jsxs("div", { className: "w-full p-3 pt-4", children: [
        "Showing ",
        initial,
        " to ",
        final,
        " of ",
        totalRecords,
        " entries"
      ] }),
      /* @__PURE__ */ jsx("div", { className: "w-full", children: /* @__PURE__ */ jsxs(
        "ul",
        {
          className: "flex flex-row justify-end gap-1",
          children: [
            /* @__PURE__ */ jsx(
              "li",
              {
                className: `paginate_button page-item previous ${totalPages <= 1 || page === 1 ? "disabled" : ""}`,
                children: /* @__PURE__ */ jsx(
                  "a",
                  {
                    className: "page-link",
                    onClick: () => {
                      this.setPage(page - 1);
                    },
                    children: /* @__PURE__ */ jsx("i", { className: "fa fa-lg fa-angle-left" })
                  }
                )
              }
            ),
            this.getPages().map((p) => {
              return /* @__PURE__ */ jsx(
                Button,
                {
                  onClick: () => p !== "..." && this.setPage(p),
                  variant: p === page ? "destructive" : "secondary",
                  children: p
                }
              );
            }),
            /* @__PURE__ */ jsx(
              "li",
              {
                className: `paginate_button page-item previous ${page >= totalPages || totalPages <= 1 ? "disabled" : ""}`,
                children: /* @__PURE__ */ jsx(
                  "a",
                  {
                    className: "page-link",
                    onClick: () => {
                      this.setPage(page + 1);
                    },
                    children: /* @__PURE__ */ jsx("i", { className: "fa fa-lg fa-angle-right" })
                  }
                )
              }
            )
          ]
        }
      ) })
    ] });
  }
  setPage(page) {
    this.props.app.setPage(page);
  }
}
export {
  PaginationClass as default
};
