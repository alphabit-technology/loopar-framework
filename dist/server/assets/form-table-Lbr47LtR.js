var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => {
  __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  return value;
};
import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import * as React from "react";
import { createElement } from "react";
import DivComponent from "./div-rCeXGfsc.js";
import { e as elementManage } from "./element-manage-OWCB4Xyr.js";
import PaginationClass from "./pagination-6me7nd6k.js";
import { c as cn, l as loopar, B as Button } from "../entry-server.js";
import { a as DynamicComponent } from "./base-component-BnGRdg1n.js";
import pkg from "lodash";
import Link from "./link-w8K-UYiW.js";
import { F as FormWrapper } from "./form-1mb5BBtU.js";
import { A as Avatar, a as AvatarFallback } from "./avatar-Q6YTls7t.js";
import { cva } from "class-variance-authority";
import { e as Card, C as CardHeader, b as CardDescription, c as CardContent, d as CardFooter } from "./card-Xssl5juf.js";
import "./form-z4zN6fsS.js";
import { C as Checkbox$1 } from "./checkbox-yqK5BTqw.js";
import { c as createLucideIcon } from "./createLucideIcon-SgSXnVj5.js";
import { T as Trash2, P as Pencil } from "./element-title-oSDJ5F20.js";
import "./component-hNq1V6er.js";
import "./file-manager-elzUYIBp.js";
import "react-dom/server";
import "clsx";
import "tailwind-merge";
import "react-router-dom";
import "@radix-ui/react-slot";
import "universal-cookie";
import "@hookform/resolvers/zod";
import "react-hook-form";
import "zod";
import "@radix-ui/react-avatar";
import "@radix-ui/react-separator";
import "./label-yp0wPYLz.js";
import "@radix-ui/react-label";
import "@radix-ui/react-checkbox";
import "./check-siG4PdgZ.js";
/**
 * @license lucide-react v0.299.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const Trash = createLucideIcon("Trash", [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }]
]);
const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
);
function Badge({ className, variant, ...props }) {
  return /* @__PURE__ */ jsx("div", { className: cn(badgeVariants({ variant }), className), ...props });
}
const Table = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("div", { className: "relative w-full overflow-auto", children: /* @__PURE__ */ jsx(
  "table",
  {
    ref,
    className: cn("w-full caption-bottom text-sm", className),
    ...props
  }
) }));
Table.displayName = "Table";
const TableHeader = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx("thead", { ref, className: cn("[&_tr]:border-b", className), ...props }));
TableHeader.displayName = "TableHeader";
const TableBody = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tbody",
  {
    ref,
    className: cn("[&_tr:last-child]:border-0", className),
    ...props
  }
));
TableBody.displayName = "TableBody";
const TableFooter = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tfoot",
  {
    ref,
    className: cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    ),
    ...props
  }
));
TableFooter.displayName = "TableFooter";
const TableRow = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "tr",
  {
    ref,
    className: cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    ),
    ...props
  }
));
TableRow.displayName = "TableRow";
const TableHead = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "th",
  {
    ref,
    className: cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    ),
    ...props
  }
));
TableHead.displayName = "TableHead";
const TableCell = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "td",
  {
    ref,
    className: cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className),
    ...props
  }
));
TableCell.displayName = "TableCell";
const TableCaption = React.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ jsx(
  "caption",
  {
    ref,
    className: cn("mt-4 text-sm text-muted-foreground", className),
    ...props
  }
));
TableCaption.displayName = "TableCaption";
const { cloneDeep } = pkg;
class BaseTable extends DivComponent {
  constructor(props) {
    super(props);
    __publicField(this, "selectors", {});
    __publicField(this, "selectorId", elementManage.uuid());
    __publicField(this, "dataExample", {
      columns_title: [],
      rows: []
    });
    __publicField(this, "rowsRef", {});
    __publicField(this, "searchData", {});
    __publicField(this, "gridSize", "sm");
    __publicField(this, "formSearch", {});
    __publicField(this, "hasHeaderOptions", false);
    this.state = {
      ...this.state,
      meta: props.meta,
      selectedRows: [],
      isOpenDropdown: false
    };
  }
  get rowsInputs() {
    return this.rows;
  }
  /**
   * #return {Array} of {Object} with all columns of the table
   * #example:
   * [
   *  {
   *    element: "input",
   *    name: "name",
   *    label: "Name"
   *  },
   *  {
   *    element: "select"
   *    name: "Document",
   *    ...
   *  }
   *
   */
  baseColumns() {
    const meta = this.meta;
    if (!meta) {
      return [];
    }
    const els = (elements) => {
      return [
        ...elements.map((el) => {
          return [{ ...el }, ...els(el.elements || [])];
        })
      ].flat();
    };
    const STRUCTURE = JSON.parse(meta.__DOCTYPE__.doc_structure);
    return els(STRUCTURE || []);
  }
  val(value) {
    if (value)
      ;
    else {
      return this.rowsInputs;
    }
  }
  get selectedRows() {
    return this.state.selectedRows;
  }
  selectRow(row, checked) {
    const selectedRows = checked ? Array.from(/* @__PURE__ */ new Set([...this.selectedRows, row.name])) : this.selectedRows.filter((r) => r !== row.name);
    this.setState({ selectedRows }, () => {
      this.setSelectorsStatus();
    });
  }
  selectAllVisibleRows(checked = true) {
    const selectedRows = checked ? this.rowsInputs.map((r) => r.name) : [];
    this.setState({ selectedRows }, () => {
      this.setSelectorsStatus();
    });
  }
  clearSelection(callBack) {
    this.setState({ selectedRows: [] }, () => {
      this.setSelectorsStatus();
      callBack && callBack();
    });
  }
  setPage(page) {
    this.pagination.page = page;
    this.search();
  }
  async search() {
    const res = await loopar.method(
      this.meta.__DOCTYPE__.name,
      this.docRef.action || this.meta.action,
      {},
      {
        body: {
          q: this.searchData,
          page: this.pagination.page || 1
        }
      }
    );
    this.setState(
      {
        meta: res.meta
      },
      () => {
        this.setSelectorsStatus();
      }
    );
  }
  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);
    if (this.props.meta !== prevProps.meta) {
      this.setState({
        meta: this.props.meta
      });
      return;
    }
    this.setSelectorsStatus();
  }
  get viewType() {
    return this.props.viewType === "List" && this.docRef.onlyGrid !== true || this.isEditable ? "List" : "Grid";
  }
  setSelectorsStatus() {
    const selectedRows = this.selectedRows.length;
    const selectorAll = this.selectors.selector_all;
    if (selectorAll) {
      const node = selectorAll.node;
      if (!node)
        return;
      node.indeterminate = false;
      if (selectedRows > 0) {
        if (selectedRows === this.rowsCount) {
          node.checked = true;
        } else {
          node.indeterminate = true;
        }
      } else {
        node.indeterminate = false;
        node.checked = false;
      }
    }
    Object.entries(this.selectors).forEach(([name, selector]) => {
      if (selector && selector.node && name !== "selector_all") {
        selector.node && (selector.node.checked = !!this.selectedRows.find(
          (row) => row === name
        ));
      }
    });
  }
  /**
   * #return {Object} with meta data of the Document
   * #example
   * {
   *   fields: [],
   *   labels: [],
   *   __DOCTYPE__: {}
   *   rows: []
   * }
   */
  get meta() {
    return this.state.meta || {};
  }
  get rows() {
    return this.meta.rows || [];
  }
  get rowsCount() {
    return this.rows.length;
  }
  addRow() {
    const rows = this.rows;
    rows.push({ name: elementManage.uuid() });
    this.state.meta.rows = rows;
    this.setState({ meta: this.meta });
  }
  get mappedColumns() {
    const baseColumns = this.baseColumns().filter((c) => c.data.in_list_view);
    return [
      ...baseColumns.filter((col) => col.element !== FORM_TABLE),
      {
        className: "align-middle text-right",
        rowsProps: {
          className: "align-middle text-right"
        },
        cellProps: {
          style: { width: 50 },
          className: "align-middle text-center"
        },
        isCustom: true,
        data: {
          name: "actions",
          label: "",
          value: (row) => {
            return /* @__PURE__ */ jsx(
              Button,
              {
                variant: "outline",
                onClick: (e) => {
                  e.preventDefault();
                  this.deleteRow(row);
                },
                children: /* @__PURE__ */ jsx(Trash, { className: "text-red-500" })
              }
            );
          }
        }
      }
    ];
  }
  getColumns() {
    var _a;
    const mappedColumns = this.mappedColumns;
    const docRefMappedColumns = ((_a = this.docRef) == null ? void 0 : _a.mappedColumns) || [];
    return mappedColumns.map((col) => {
      const mapped = docRefMappedColumns.find(
        (c) => c.data.name === col.data.name
      );
      if (mapped) {
        return {
          ...col,
          ...mapped
        };
      }
      return col;
    });
  }
  /*fieldIsWritable(field) {
      return elementsDict[field.element]?.def?.isWritable;
   }*/
  getTableRender(columns, rows) {
    columns = columns.filter(
      (c) => !this.hiddenColumns.includes(c.data.name)
    );
    return /* @__PURE__ */ jsxs(Table, { stickyHeader: true, "aria-label": "sticky table", children: [
      /* @__PURE__ */ jsx(TableHeader, { className: "bg-slate-300/50 dark:bg-slate-800/50", children: /* @__PURE__ */ jsxs(TableRow, { children: [
        /* @__PURE__ */ jsx(TableHead, { padding: "checkbox", className: "w-10", children: /* @__PURE__ */ jsx(
          Checkbox$1,
          {
            checked: rows.length > 0 && this.selectedRows.length === rows.length,
            indeterminate: rows.length > 0 && this.selectedRows.length > 0 && this.selectedRows.length < rows.length,
            onChange: (event) => {
              this.selectAllVisibleRows(event.target.checked);
            }
          }
        ) }),
        columns.map((c) => {
          const data = c.data;
          const cellProps = c.cellProps ?? {};
          return /* @__PURE__ */ jsx(TableCell, { ...cellProps, children: typeof data.label == "function" ? data.label() : data.label ? loopar.utils.UPPERCASE(data.label) : "..." });
        })
      ] }) }),
      /* @__PURE__ */ jsx(TableBody, { children: rows.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, { colSpan: columns.length, children: /* @__PURE__ */ jsx("div", { className: "card empty-state", children: /* @__PURE__ */ jsxs("div", { className: "empty-state-container", children: [
        /* @__PURE__ */ jsx("div", { className: "empty-state-icon h1", children: /* @__PURE__ */ jsx("i", { className: "fa fa-exclamation-triangle" }) }),
        /* @__PURE__ */ jsx("div", { className: "empty-state-text h6", children: "No rows to show" })
      ] }) }) }) }) : rows.map((row) => {
        this.rowsRef[row.name] = {};
        return /* @__PURE__ */ jsxs(TableRow, { hover: true, role: "checkbox", tabIndex: -1, children: [
          /* @__PURE__ */ jsx(TableCell, { padding: "checkbox", children: /* @__PURE__ */ jsx(
            Checkbox$1,
            {
              onChange: (event) => {
                this.selectRow(row, event.target.checked);
              },
              checked: this.selectedRows.includes(row.name)
            }
          ) }),
          columns.map((column) => {
            const celProps = column.celProps ?? {};
            if (this.isEditable && fieldIsWritable(column)) {
              const props = { ...column };
              props.data ?? (props.data = {});
              props.data.value = row[column.data.name];
              return /* @__PURE__ */ createElement(
                TableCell,
                {
                  ...celProps,
                  key: column.name
                },
                /* @__PURE__ */ jsx(
                  DynamicComponent,
                  {
                    elements: [
                      {
                        element: column.element || DIV,
                        key: row.name + "_" + column.data.name,
                        withoutLabel: true,
                        simpleInput: true,
                        ...cloneDeep(props),
                        onChange: (e, value) => {
                          row[column.data.name] = value;
                        },
                        ref: (self) => {
                          if (self) {
                            this.rowsRef[row.name][column.data.name] = self;
                          }
                        }
                      }
                    ],
                    parent: this
                  }
                )
              );
            } else {
              let value = row[column.data.name];
              let className = `align-middle`;
              if (typeof column.data.value == "function") {
                value = column.data.value(row);
              }
              if ([SWITCH, CHECKBOX].includes(column.element)) {
                value = /* @__PURE__ */ jsx(
                  "i",
                  {
                    className: `fa fa-fw fa-circle text-${value ? "green" : "red"}`
                  }
                );
                className += ` text-center`;
              } else {
                className += ` text-${column.data.align ?? "left"}`;
              }
              return /* @__PURE__ */ jsx(
                TableCell,
                {
                  className,
                  ...celProps,
                  children: value
                },
                row.name + "_" + column.data.name + "_td"
              );
            }
          })
        ] }, "row" + row.name);
      }) })
    ] });
  }
  get docRef() {
    return this.props.docRef || {};
  }
  getGridRender(columns, rows) {
    return /* @__PURE__ */ jsx("div", { className: "justify flex flex-wrap gap-3 border p-2", children: rows.map((row) => {
      const action = row.is_single ? row.type === "Page" ? "view" : "update" : "list";
      row.document_status || "Active";
      const color = loopar.bgColor(row.name);
      return this.docRef.gridTemplate ? this.docRef.gridTemplate(row, action, this) : /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsxs(Card, { className: "w-full min-w-[300px]", children: [
        /* @__PURE__ */ jsx(CardHeader, { children: /* @__PURE__ */ jsx(CardDescription, { children: /* @__PURE__ */ jsx(
          Badge,
          {
            variant: "secondary",
            className: "bg-secondary text-white",
            children: row.type
          }
        ) }) }),
        /* @__PURE__ */ jsx(CardContent, { children: /* @__PURE__ */ jsxs("div", { className: "justify-left flex gap-3", children: [
          /* @__PURE__ */ jsx(Avatar, { className: `rounded-3 h-14 w-14`, style: { backgroundColor: color }, children: /* @__PURE__ */ jsx(AvatarFallback, { className: `bg-transparent text-2xl font-bold`, children: loopar.utils.avatar(row.name) }) }),
          /* @__PURE__ */ jsxs("p", { children: [
            /* @__PURE__ */ jsx("h4", { children: row.name }),
            /* @__PURE__ */ jsx("h6", { className: "font-bold text-slate-500 dark:text-slate-400", children: row.module })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs(CardFooter, { className: "flex justify-between", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "outline",
              onClick: (e) => {
                e.preventDefault();
                this.deleteRow(row);
              },
              children: [
                /* @__PURE__ */ jsx(Trash2, { className: "mr-2" }),
                "Delete"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            Link,
            {
              variant: "outline",
              to: `update?documentName=${row.name}`,
              children: [
                /* @__PURE__ */ jsx(Pencil, { className: "mr-2" }),
                "Update"
              ]
            }
          )
        ] })
      ] }) });
    }) });
  }
  get documentName() {
    return this.props.meta.__DOCTYPE__.name;
  }
  get hiddenColumns() {
    var _a;
    return ((_a = this.props.docRef) == null ? void 0 : _a.hiddenColumns) || [];
  }
  conciliateSelectedRows() {
    const selectedRows = this.selectedRows;
    const rowsNames = this.rows.map((row) => row.name);
    this.state.selectedRows = selectedRows.filter(
      (row) => rowsNames.includes(row)
    );
  }
  getFormSearch(searchFields) {
    return /* @__PURE__ */ jsx(FormWrapper, { children: /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6", children: searchFields.length > 0 && this.hasSearchForm ? searchFields.map((c) => {
      c.rowsProps ?? {};
      if (c.data.name !== "selector_all") {
        if (fieldIsWritable(c)) {
          const data = {
            ...{
              simpleInput: false,
              withoutLabel: true
            },
            ...c.data
          };
          data.value = this.searchData[c.data.name] ?? "";
          data.name = c.data.name;
          data.label = c.data.label;
          data.size = "sm";
          return /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
            DynamicComponent,
            {
              elements: [
                {
                  element: c.element,
                  key: c.data.name,
                  data,
                  dontHaveForm: true,
                  onChange: (e) => {
                    const value = e.target ? e.target.value : e;
                    if (value) {
                      this.searchData[c.data.name] = `${value}`;
                    } else {
                      delete this.searchData[c.data.name];
                    }
                    clearTimeout(this.lastSearch);
                    this.lastSearch = setTimeout(
                      () => {
                        this.search();
                      },
                      [SELECT, SWITCH, CHECKBOX].includes(
                        c.element
                      ) ? 0 : 300
                    );
                  }
                }
              ],
              parent: this
            }
          ) });
        }
      }
    }) : null }) });
  }
  render() {
    const columns = this.getColumns().filter(
      (col) => col.data.hidden !== 1 && col.data.in_list_view !== 0
    );
    const searchFields = this.baseColumns().filter(
      (col) => fieldIsWritable(col) && [INPUT, TEXTAREA, SELECT, CHECKBOX, SWITCH].includes(col.element) && (col.data.searchable || col.data.name === "name")
    );
    const rows = Array.isArray(this.rows) ? this.rows : [];
    this.conciliateSelectedRows();
    const selectedRowsCount = this.selectedRows.length;
    this.searchData = this.meta.q && typeof this.meta.q == "object" ? this.meta.q : {};
    this.rowsRef = {};
    const setPage = (page) => {
      this.pagination.page = page;
      this.search();
    };
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "pb-4", children: this.getFormSearch(searchFields) }),
      /* @__PURE__ */ jsx("div", { className: "align-self-start btn-toolbar ml-auto", children: /* @__PURE__ */ jsxs("div", { className: "btn-group", style: { marginTop: -5 }, children: [
        selectedRowsCount > 0 ? /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "btn btn-light text-danger",
            onClick: () => this.bulkRemove(),
            children: [
              /* @__PURE__ */ jsx("i", { className: "oi oi-trash" }),
              /* @__PURE__ */ jsxs("span", { className: "ml-1", children: [
                "Remove (",
                selectedRowsCount,
                ")"
              ] })
            ]
          }
        ) : null,
        this.isEditable ? /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            className: "btn btn-light",
            onClick: () => this.addRow(),
            children: /* @__PURE__ */ jsx("i", { className: "oi oi-plus" })
          }
        ) : null
      ] }) }),
      /* @__PURE__ */ jsx("div", { className: "border", children: this.viewType === "List" ? this.getTableRender(columns, rows) : this.getGridRender(columns, rows) }),
      /* @__PURE__ */ jsxs("div", { spacing: 3, children: [
        this.hasFooterOptions ? /* @__PURE__ */ jsx("div", { className: "card-footer-item", children: /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            className: "btn btn-reset text-nowrap text-default",
            onClick: () => this.addRow(),
            children: [
              /* @__PURE__ */ jsx("i", { className: "fa fa-plus mr-1" }),
              "Add row"
            ]
          }
        ) }) : null,
        this.hasPagination ? /* @__PURE__ */ jsx(PaginationClass, { pagination: this.pagination, onChange: setPage, app: this }) : null
      ] })
    ] });
  }
  get pagination() {
    return this.meta.pagination || {};
  }
  bulkRemove() {
    const updatedRows = this.rows.filter(
      (row) => !this.selectedRows.includes(row.name)
    );
    this.setState((prevState) => ({
      meta: {
        ...prevState.meta,
        rows: updatedRows
      },
      selectedRows: []
    }));
  }
  deleteRow(row) {
    this.setState((prevState) => {
      const updatedMetaRows = prevState.meta.rows.filter(
        (r) => r.name !== row.name
      );
      const updatedSelectedRows = prevState.selectedRows.filter(
        (r) => r !== row.name
      );
      return {
        meta: {
          ...prevState.meta,
          rows: updatedMetaRows
        },
        selectedRows: updatedSelectedRows
      };
    });
  }
}
class FormTable extends BaseTable {
  constructor(props) {
    super(props);
    __publicField(this, "isWritable", true);
    __publicField(this, "hasFooterOptions", true);
    __publicField(this, "hasPagination", false);
    __publicField(this, "isEditable", true);
    __publicField(this, "className", "feed");
    __publicField(this, "hasHeaderOptions", true);
    __publicField(this, "viewType", "List");
  }
  validate() {
    return Object.entries(this.rowsRef).reduce((acc, [key, row]) => {
      return acc.concat(
        Object.values(row).map((el) => {
          return el == null ? void 0 : el.validate();
        }).filter((el) => !(el == null ? void 0 : el.valid)).map((el) => {
          return {
            message: "Row " + key + " " + el.message,
            valid: el.valid
          };
        })
      );
    }, []);
  }
  get metaFields() {
    return [
      {
        group: "form",
        elements: {
          options: {
            element: TEXTAREA
          }
        }
      }
    ];
  }
}
class ListGrid extends BaseTable {
  constructor(props) {
    super(props);
    __publicField(this, "isWritable", false);
    __publicField(this, "hasFooterOptions", false);
    __publicField(this, "hasHeaderOptions", false);
    __publicField(this, "hasPagination", true);
    __publicField(this, "gridSize", "lg");
    __publicField(this, "overflow", "auto");
    __publicField(this, "hasSearchForm", true);
    __publicField(this, "style", { height: "100%" });
    __publicField(this, "deleteRow", (row) => {
      loopar.dialog({
        type: "confirm",
        title: "Confirm",
        message: `Are you sure you want to delete ${row.name}?`,
        ok: async () => {
          await loopar.method(this.meta.__DOCTYPE__.name, "delete", {
            documentName: row.name
          });
          loopar.rootApp.refresh().then(() => {
            loopar.navigate(window.location.pathname);
          });
          loopar.notify({
            type: "success",
            title: "Success",
            message: `Document ${row.name} deleted`
          });
        }
      });
    });
  }
  get mappedColumns() {
    const base = super.mappedColumns.filter((col) => col.data.name !== "name");
    const customName = [
      {
        rowsProps: { className: "align-middle text-truncate" },
        isCustom: true,
        data: {
          name: "name",
          label: "Name",
          value: (row) => {
            const color = loopar.bgColor(row.name);
            console.log(["Row Name", row.name]);
            return /* @__PURE__ */ jsxs(
              Link,
              {
                to: `update?documentName=${row.name}`,
                className: "justify-left flex gap-3 align-middle",
                children: [
                  /* @__PURE__ */ jsx(Avatar, { className: `rounded-3 h-11 w-11`, style: { backgroundColor: color }, children: /* @__PURE__ */ jsx(AvatarFallback, { className: `bg-transparent text-xl font-bold`, children: loopar.utils.avatar(row.name) }) }),
                  /* @__PURE__ */ jsxs("div", { className: "h-ful items-left flex flex-col justify-center", children: [
                    /* @__PURE__ */ jsx("h1", { children: row.name }),
                    /* @__PURE__ */ jsx("h5", { className: "font-bold text-slate-500 dark:text-slate-400", children: loopar.utils.UPPERCASE(row.module) })
                  ] })
                ]
              }
            );
          }
        }
      }
    ];
    base.splice(0, 0, ...customName);
    return base;
  }
  bulkRemove() {
    const rowsSelected = this.selectedRows;
    loopar.confirm(
      `Are you sure you want to delete ${rowsSelected.join(", ")} documents?`,
      async () => {
        await loopar.method(this.meta.__DOCTYPE__.name, "bulkDelete", {
          documentNames: JSON.stringify(rowsSelected)
        });
        this.search();
      }
    );
  }
}
export {
  BaseTable,
  FormTable,
  ListGrid
};
