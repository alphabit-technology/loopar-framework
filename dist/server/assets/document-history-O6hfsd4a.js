var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsxs, Fragment, jsx } from "react/jsx-runtime";
import { C as Component } from "./component-hNq1V6er.js";
import { l as loopar } from "../entry-server.js";
import "react";
import PaginationClass from "./pagination-6me7nd6k.js";
import "./file-manager-elzUYIBp.js";
import "./element-manage-OWCB4Xyr.js";
import "./base-component-BnGRdg1n.js";
import "./element-title-oSDJ5F20.js";
import "./createLucideIcon-SgSXnVj5.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "class-variance-authority";
import "universal-cookie";
import "./div-rCeXGfsc.js";
class DocumentHistory extends Component {
  constructor(props) {
    super(props);
    __publicField(this, "blockComponent", true);
    __publicField(this, "className", "card card-fluid");
    this.state = {
      ...this.state,
      collapsed: this.getStatusCollapsable(),
      history: []
    };
  }
  async getHistory() {
    const data = await loopar.method("Document History", "history", {
      documentName: this.props.document,
      documentId: this.props.document_id,
      page: this.currentPage || 1
    });
    this.setState({
      history: data.meta.rows,
      pagination: data.meta.pagination
    });
  }
  async search() {
    await this.getHistory();
  }
  get pagination() {
    return this.state.pagination || {};
  }
  componentDidMount() {
    this.getHistory();
  }
  setPage(page) {
    this.currentPage = page;
    this.search();
  }
  render() {
    const data = {
      label: "History"
    };
    super.render(
      /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "card-header", children: /* @__PURE__ */ jsx("h6", { children: /* @__PURE__ */ jsxs(
          "a",
          {
            className: "btn btn-reset",
            onClick: () => {
              this.toggleHide();
            },
            children: [
              /* @__PURE__ */ jsx("span", { className: "mr-2", children: data.label }),
              /* @__PURE__ */ jsx("span", { className: "collapse-icon ml-2", children: /* @__PURE__ */ jsx(
                "i",
                {
                  className: `fas fa-chevron-${this.state.collapsed ? "down" : "up"}`,
                  onClick: () => {
                    this.toggleHide();
                  }
                }
              ) })
            ]
          }
        ) }) }),
        /* @__PURE__ */ jsxs(
          "div",
          {
            ref: (el) => this.container = el,
            className: `card-body collapse show element sub-element ${this.props.bodyClassName || ""}`,
            style: this.state.collapsed ? { display: "none" } : {},
            children: [
              /* @__PURE__ */ jsx("ul", { className: "timeline", children: this.state.history.map((row, key) => {
                const icon = row.action === "Created" ? "fa-plus" : row.action === "Updated" ? "fa-edit" : "fa-trash";
                return /* @__PURE__ */ jsxs("li", { className: "timeline-item", children: [
                  /* @__PURE__ */ jsx("div", { className: "timeline-figure", children: /* @__PURE__ */ jsx("span", { className: "tile tile-circle tile-sm", children: /* @__PURE__ */ jsx("i", { className: `fa ${icon} fa-lg` }) }) }),
                  /* @__PURE__ */ jsx("div", { className: "timeline-body", children: /* @__PURE__ */ jsxs("div", { className: "media", children: [
                    /* @__PURE__ */ jsxs("div", { className: "media-body", children: [
                      /* @__PURE__ */ jsxs("h6", { className: "timeline-heading", children: [
                        /* @__PURE__ */ jsx("a", { href: "#", className: "text-link", children: row.user }),
                        " " + row.action
                      ] }),
                      /* @__PURE__ */ jsx("p", { className: "timeline-date d-sm-none", children: row.date })
                    ] }),
                    /* @__PURE__ */ jsx("div", { className: "d-sm-block", children: /* @__PURE__ */ jsx("span", { className: "timeline-date", children: row.date }) })
                  ] }) })
                ] }, key);
              }) }),
              PaginationClass({
                pagination: this.pagination,
                app: this
              })
            ]
          }
        )
      ] })
    );
  }
  getStatusCollapsable() {
    const { document, document_id } = this.props;
    const collapsed = localStorage.getItem(`${document}${document_id}`);
    return collapsed === null ? true : collapsed === "true";
  }
  toggleHide() {
    const { document, document_id } = this.props;
    const collapsed = this.getStatusCollapsable();
    localStorage.setItem(`${document}${document_id}`, !collapsed);
    this.setState({
      collapsed: !collapsed
    });
  }
}
export {
  DocumentHistory as default
};
