import Div from "/components/elements/div.js";
import { a, button, div, Element, i, input, label, small, span, table, tbody, td, th, thead, tr, h5 } from "/components/elements.js";

import { elementManage } from "../element-manage.js";
import { Pagination } from "/components/common/pagination.js";
import { loopar } from "/loopar.js";
import { elementsDict } from "/element-definition.js";

class BaseTable extends Div {
   selectors = {};
   selectorId = elementManage.uuid();
   dataExample = {
      columns_title: [],
      rows: []
   };

   rowsRef = {};
   searchData = {};
   gridSize = "sm";
   formSearch = {};

   hasHeaderOptions = false

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         meta: props.meta,
         selectedRows: [],
         isOpenDropdown: false
      }
   }

   get rowsInputs() {
      return this.rows
   }

   /**
    * @return {Array} of {Object} with all columns of the table
    * @example:
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
            ...elements.map(el => {
               return [{ ...el }, ...els(el.elements || [])];
            })
         ].flat()//.filter(e => e.isWritable);
      }

      return els(meta.__DOCTYPE__?.STRUCTURE || []);
   }

   val(value) {
      if (value) {
         /*const data = this.state.data || {};
         data.value = value;
         this.state.meta.data = data
         this.setState({meta: this.state.meta})*/
      } else {
         return this.rowsInputs;
      }
   }

   get selectedRows() {
      return this.state.selectedRows;
   }

   selectRow(row, checked) {
      const selectedRows = checked ? Array.from(new Set([...this.selectedRows, row.name])) : this.selectedRows.filter(r => r !== row.name);

      this.setState({ selectedRows }, () => {
         this.setSelectorsStatus();
      });
   }

   selectAllVisibleRows(checked = true) {
      const selectedRows = checked ? this.rowsInputs.map(r => r.name) : [];

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
      this.currentPage = page;
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
               page: this.currentPage || 1
            }
         }
      ) 
      this.setState({
         meta: res.meta
      }, () => {
         this.setSelectorsStatus();
      });
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
      return (this.props.viewType === "List" && this.docRef.onlyGrid !== true) || this.isEditable ? "List" : "Grid";
   }

   setSelectorsStatus() {
      const selectedRows = this.selectedRows.length;
      const selectorAll = this.selectors.selector_all;

      if (selectorAll){
         const node = selectorAll.node;
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
         if (selector && selector.node && name !== 'selector_all') {
            selector.node.checked = !!this.selectedRows.find(row => row === name);
         }
      });
   }

   /**
    * @return {Object} with meta data of the Document
    * @example
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
      const baseColumns = this.baseColumns().filter(c => c.data.in_list_view);

      return [
         {
            isCustom: true,
            rowsProps: {
               className: "align-middle col-checker"
            },
            data: {
               name: "selector_all",
               label: () => {
                  const rowsSelected = this.selectedRows.length;

                  return div({ className: "thead-dd dropdown" }, [
                     span({ className: "custom-control custom-control-nolabel custom-checkbox" }, [
                        input({
                           type: "checkbox",
                           className: "custom-control-input",
                           "aria-label": "Select all rows",
                           id: this.selectorId,
                           onChange: (e) => {
                              this.selectAllVisibleRows(e.target.checked);
                           },
                           ref: self => {
                              this.selectors.selector_all = self;
                           }
                        }),
                        label({
                           className: "custom-control-label",
                           htmlFor: this.selectorId,
                        })
                     ]),
                     div({
                        className: "thead-btn", role: "button",/* onClick:() => this.toggleDropdown(),*/
                        "data-toggle": "dropdown",
                     }, [
                        /*span({className: "selected-row-info text-muted pl-1",}, [
                           rowsSelected && rowsSelected > 0 ? `${rowsSelected} selected ` : ''
                        ]),*/
                        span({ className: "fa fa-caret-down" })
                     ]),
                     div({ className: `dropdown-menu` }, [
                        div({ className: "dropdown-arrow" }),
                        rowsSelected && rowsSelected > 0 ? [
                           a({ className: "dropdown-item", href: "#", onClick: () => { this.selectAllVisibleRows() } }, [
                              `${rowsSelected} selected`
                           ]),
                           div({ className: "dropdown-divider" })
                        ] : null,
                        a({ className: "dropdown-item", href: "#", onClick: () => { this.selectAllVisibleRows() } }, [
                           "Select all"
                        ]),
                        a({ className: "dropdown-item", href: "#", onClick: () => { this.selectAllVisibleRows(false) } }, [
                           "Unselect all"
                        ]),
                        div({ className: "dropdown-divider" }),
                        a({ className: `dropdown-item ${rowsSelected === 0 ? 'disabled' : ''}`, href: "#", onClick: () => this.bulkRemove() }, [
                           "Bulk remove"
                        ])
                     ])
                  ])
               },
               value: (row) => {
                  return span({ className: "custom-control custom-control-nolabel custom-checkbox" }, [
                     input({
                        key: row.name + "_selector" + this.viewType,
                        type: "checkbox",
                        className: "custom-control-input",
                        id: row.name + "_selector",
                        onChange: (e) => {
                           this.selectRow(row, e.target.checked);
                        },
                        ref: (self) => this.selectors[row.name] = self,
                     }),
                     label({
                        key: row.name + "_selector_label",
                        className: "custom-control-label",
                        htmlFor: row.name + "_selector",
                     })
                  ])
               }
            }
         },
         ...baseColumns.filter(col => col.element !== FORM_TABLE),
         {
            className: "align-middle text-right",
            rowsProps: {
               className: "align-middle text-right"
            },
            isCustom: true,
            data: {
               name: 'actions',
               label: '',
               value: (row) => {
                  return button({
                     className: "btn btn-sm btn-icon btn-outline-danger",
                     onClick: (e) => {
                        e.preventDefault();
                        this.deleteRow(row);
                     }
                  }, [
                     i({ className: "fas fa-trash-alt" })
                  ])
               }
            }
         }
      ];
   }

   getColumns(){
      const mappedColumns = this.mappedColumns;
      const docRefMappedColumns = this.docRef?.mappedColumns || [];

      return mappedColumns.map(col => {
         const mapped = docRefMappedColumns.find(c => c.data.name === col.data.name);

         if (mapped) {
            return {
               ...col,
               ...mapped
            }
         }

         return col;
      });
   }

   /*fieldIsWritable(field) {
      return elementsDict[field.element]?.def?.isWritable;
   }*/

   getTableRender(_columns, rows) {
      const columns = _columns.filter(c => !this.hiddenColumns.includes(c.data.name))

      return [
         table({ className: `table table-${this.gridSize} mb-0 table-hover bordered`, style: {} }, [
            thead([
               tr([
                  columns.map(c => {
                     const data = c.data;
                     let className = `align-middle`;

                     if ([SWITCH, CHECKBOX].includes(c.element)) {
                        className += ` text-center`;
                     } else {
                        className += ` text-${data.align ?? 'left'}`;
                     }

                     const props = data.name === "selector_all" ?
                        {
                           className: "col-checker align-middle",
                           style: {
                              maxWidth: 30
                           }
                        } :
                        {
                           className: className,
                           ...(data.name === "name" ? { className: "pl-3" } : {}),
                        };

                     return th({...props, ...c.colProps ?? {}}, [
                        typeof data.label == "function" ? data.label() : data.label
                     ])
                  })
               ])
            ]),
            tbody([
               rows.length === 0 ? tr(td({ colSpan: columns.length }, [
                  div({ className: "card empty-state" }, [
                     div({ className: 'empty-state-container' }, [
                        div({ className: 'empty-state-icon h1' }, [
                           i({ className: 'fa fa-exclamation-triangle' })
                        ]),
                        div({ className: 'empty-state-text h6' }, [
                           'No rows to show'
                        ])
                     ])
                  ])
               ])) :
                  rows.map(row => {
                     this.rowsRef[row.name] = {};
                     return tr({
                        //key: elementManage.uuid()
                     }, [
                        columns.map(column => {
                           const celProps = column.celProps ?? {};

                           if (column.data.name === "selector_all") {
                              return td({ className: "col-checker align-middle", ...celProps }, column.data.value(row));
                           }

                           if (this.isEditable && fieldIsWritable(column)) {
                              const props = { ...column };
                              props.data ??= {};
                              props.data.value = row[column.data.name];

                              return td({
                                 //key: elementManage.uuid(), 
                                 ...celProps,
                              },
                                 Element(column.element, {
                                    //key: elementManage.uuid(),
                                    key: row.name + "_" + column.data.name,
                                    meta: clone(props),
                                    withoutLabel: true,
                                    simpleInput: true,
                                    onChange: (e) => {
                                       row[column.data.name] = e.target.value
                                    },
                                    ref: self => {
                                       if (self) {
                                          this.rowsRef[row.name][column.data.name] = self;
                                       }
                                    }
                                 })
                              );
                           } else {
                              let value = row[column.data.name];
                              let className = `align-middle`;
                              if (typeof column.data.value == "function") {
                                 value = column.data.value(row);
                              }

                              if ([SWITCH, CHECKBOX].includes(column.element)) {
                                 value = i({ className: `fa fa-fw fa-circle text-${value ? 'green' : 'red'}` });
                                 className += ` text-center`;
                              } else {
                                 className += ` text-${column.data.align ?? 'left'}`;
                              }

                              return td({
                                 //key: elementManage.uuid(),
                                 className: className,
                                 key: row.name + "_" + column.data.name + "_td",
                                 ...celProps
                              }, [
                                 value
                              ]);
                           }
                        })
                     ])
                  })
            ])
         ])
      ]
   }

   get docRef() {
      return this.props.docRef || {};
   }

   getGridRender(columns, rows) {
      return [
         div({ className: `row row-cards row-deck` }, [
            rows.length === 0 ? div({ className: "col-12" }, [
               div({ className: "card empty-state" }, [
                  div({ className: 'empty-state-container' }, [
                     div({ className: 'empty-state-icon h1' }, [
                        i({ className: 'fa fa-exclamation-triangle' })
                     ]),
                     div({ className: 'empty-state-text h6' }, [
                        'No rows to show'
                     ])
                  ])
               ])
            ]) : [
               div({ className: "col-12" }, [
                  div({
                     className: "grid-container",
                     style: { gridTemplateColumns: `repeat(auto-fit, minmax(${this.docRef.cardSize || 150}px, 1fr))` }
                  }, [
                     rows.map(row => {
                        const action = row.is_single ? (row.type === 'Page' ? 'view' : 'update') : 'list';

                        return div({ className: "grid-item", style: { maxHeight: this.docRef.cardSize || 180 } }, [
                           div({ className: "card text-dark bg-light metric-bordered", style: { height: '100%' } }, [
                              this.docRef.gridTemplate ? this.docRef.gridTemplate(row, action, this) : [
                                 div({ className: "card-body text-center" }, [
                                    a({ className: `tile tile-lg bg-${loopar.bgColor(row.name)} mb-2`, href: `/${row.module}/${row.name}/${action}`, element: `element-${action}` }, loopar.utils.avatar(row.name)),
                                    h5({ className: "card-title" }, [
                                       a({ className: "card-title", href: "#" }, row.name)
                                    ]),
                                    div({ className: "my-3" }, [
                                       div({ className: "avatar-group" })
                                    ])
                                 ]),
                                 div({ className: "card-footer" }, [
                                    a({
                                       className: "card-footer-item card-footer-item-bordered card-link",
                                       href: "#",
                                       onClick: (e) => {
                                          e.preventDefault();
                                          this.deleteRow(row);
                                       }
                                    }, "Delete"),
                                    a({
                                       className: "card-footer-item card-footer-item-bordered card-link",
                                       href: `update?documentName=${row.name}`,
                                    }, "Update")
                                 ])
                              ]
                           ])
                        ])
                     })
                  ])
               ])
            ]
         ])
      ]
   }

   get documentName() {
      return this.props.meta.__DOCTYPE__.name;
   }

   get hiddenColumns() {
      return this.props.docRef?.hiddenColumns || [];
   }

   conciliateSelectedRows() {
      const selectedRows = this.selectedRows;
      const rowsNames = this.rows.map(row => row.name);

      this.state.selectedRows = selectedRows.filter(row => rowsNames.includes(row));
   }

   render() {
      const columns = this.getColumns().filter(col => col.data.hidden !== 1 && col.data.in_list_view !== 0);
      const searchFields = this.baseColumns().filter(col => fieldIsWritable(col) && [INPUT, TEXTAREA, SELECT, CHECKBOX, SWITCH].includes(col.element) && (col.data.searchable || col.data.name === 'name'));
      const rows = Array.isArray(this.rows) ? this.rows : [];
      this.conciliateSelectedRows();
      const selectedRowsCount = this.selectedRows.length;

      this.searchData = (this.meta.q && typeof this.meta.q == "object") ? this.meta.q : {};
      this.rowsRef = {};

      return super.render([
         div({ className: "feed-post card", style: { height: "100%" } }, [
            div({ className: "metric-row" }, [
               div({ className: "col-lg-12" }, [
                  div({ className: "metric-row metric-flush", style: { paddingLeft: 5, paddingRight: 5, marginBottom: -20 } }, [
                     this.data.label ? div({ className: "col-xl-2 col-lg-3 col-md-4 col-sm-6" }, [
                        div({ className: 'd-flex align-items-center' }, [
                           span({ className: 'mr-auto' }, this.data.label),
                        ]),
                     ]) : null,
                     (searchFields.length > 0 && this.hasSearchForm) ? searchFields.map(c => {
                        const celProps = c.rowsProps ?? {};

                        if (c.data.name !== "selector_all") {
                           if (fieldIsWritable(c)) {
                              const meta = { ...{ simpleInput: false, withoutLabel: true }, ...c };
                              //const meta = {};

                              meta.data ??= {};
                              meta.data.value = this.searchData[c.data.name] ?? "";
                              meta.data.name = c.data.name;
                              meta.data.label = c.data.label;
                              meta.data.size = "sm";
                              meta.focus = this.currrentInputSearch === c.data.name;

                              return div({
                                 //key: elementManage.uuid(), ...celProps,
                                 className: "col-xl-2 col-lg-3 col-md-4 col-sm-6"
                              }, [
                                 Element(c.element, {
                                    ref: self => this.formSearch[c.data.name] = self,
                                    meta: clone(meta),
                                    ...meta,
                                    onChange: e => {
                                       this.searchData[c.data.name] = e.target.value;
                                       clearTimeout(this.lastSearch);
                                       this.lastSearch = setTimeout(() => {
                                          this.currrentInputSearch = c.data.name;
                                          this.search();
                                       }, [SELECT, SWITCH, CHECKBOX].includes(c.element) ? 0 : 300);
                                    }
                                 })
                              ]);
                           }
                        }
                     }) : null,
                     div({ className: 'align-self-start ml-auto btn-toolbar' }, [
                        div({ className: 'btn-group', style: { marginTop: -5 } }, [
                           /*button({type: 'button', className: 'btn btn-light', onClick: () => this.export()}, [
                              i({className: 'oi oi-data-transfer-download'}),
                              span({className: 'ml-1'}, 'Export')
                           ]),
                           button({type: 'button', className: 'btn btn-light', onClick: () => this.import()}, [
                              i({className: 'oi oi-data-transfer-upload'}),
                              span({className: 'ml-1'}, 'Import')
                           ]),
                           button({type: 'button', className: 'btn btn-light', onClick: () => this.refresh()}, [
                              i({className: 'oi oi-reload'}),
                              span({className: 'ml-1'}, 'Refresh')
                           ]),*/
                           selectedRowsCount > 0 ? button({ type: 'button', className: 'btn btn-light text-danger', onClick: () => this.bulkRemove() }, [
                              i({ className: 'oi oi-trash' }),
                              span({ className: 'ml-1' }, `Remove (${selectedRowsCount})`)
                           ]) : null,
                           this.isEditable ? button({ type: 'button', className: 'btn btn-light', onClick: () => this.addRow() }, [
                              i({ className: 'oi oi-plus' })
                           ]) : null,
                        ])
                     ]),
                  ])
               ]),
            ]),
            div({
               className: 'card-body border-top',
               style: {
                  overflow: this.overflow || "",
                  ...((this.hasSearchForm && this.viewType === "List") ? { paddingTop: 0 } : {})
               }
            }, [
               this.viewType === "List" ? this.getTableRender(columns, rows) : this.getGridRender(columns, rows)
            ]),
            div({ className: 'card-footer' }, [
               this.hasFooterOptions ? [
                  selectedRowsCount > 0 ? div({ className: "card-footer-item" }, [
                     button({ type: "button", className: "btn btn-reset text-nowrap text-danger", onClick: () => this.bulkRemove() }, [
                        i({ className: "fa fa-trash-alt mr-1" }),
                        "Remove"
                     ]),
                  ]) : null,
                  div({ className: "card-footer-item" }, [
                     button({ type: "button", className: "btn btn-reset text-nowrap text-default", onClick: () => this.addRow() }, [
                        i({ className: "fa fa-plus mr-1" }),
                        "Add row"
                     ])
                  ]),
               ] : null,
               this.hasPagination ? [
                  Pagination({
                     pagination: this.pagination,
                     app: this
                  })
               ] : null
            ])
         ])
      ])
   }

   get pagination() {
      return this.meta.pagination || {};
   }

   bulkRemove() {
      const updatedRows = this.rows.filter(row => !this.selectedRows.includes(row.name));

      this.setState(prevState => ({
         meta: {
            ...prevState.meta,
            rows: updatedRows
         },
         selectedRows: []
      }));
   }

   deleteRow(row) {
      this.setState(prevState => {
         const updatedMetaRows = prevState.meta.rows.filter(r => r.name !== row.name);
         const updatedSelectedRows = prevState.selectedRows.filter(r => r !== row.name);

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

export default class FormTable extends BaseTable {
   isWritable = true;
   hasFooterOptions = true;
   hasPagination = false;
   isEditable = true;
   className = "feed";
   hasHeaderOptions = true;
   viewType = "List";

   constructor(props) {
      super(props);
   }

   validate() {
      return Object.entries(this.rowsRef).reduce((acc, [key, row]) => {
         return acc.concat(Object.values(row).map(el => {
            return el?.validate();
         }).filter(el => !el?.valid).map(el => {
            return {
               message: "Row " + key + " " + el.message,
               valid: el.valid
            }
         }))
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
      ]
   }
}

class ListGridClass extends BaseTable {
   isWritable = false;
   hasFooterOptions = false;
   hasHeaderOptions = false;
   hasPagination = true;
   gridSize = "lg";
   overflow = "auto";
   hasSearchForm = true;

   style = { height: "100%" };

   constructor(props) {
      super(props);
   }

   get mappedColumns() {
      const base = super.mappedColumns.filter(col => col.data.name !== "name");

      const customName = [
         {
            rowsProps: { className: "align-middle text-truncate" },
            isCustom: true,
            data: {
               name: "name",
               label: "Name",
               value: row => {
                  return div({ className: "media align-items-center" }, [
                     a({
                        key: row.name + "_avatar",
                        href: `update?documentName=${row.name}`,
                        className: `tile bg-${loopar.bgColor(row.name)} text-white mr-2`
                     }, loopar.utils.avatar(row.name)),
                     div({ className: "media-body" }, [
                        a({
                           key: row.name + "_description",
                           href: `update?documentName=${row.name}`
                        }, row.description || row.name),
                        small({ className: "d-block text-muted" }, row.name)
                     ])
                  ]);
               }
            }
         }
      ];

      base.splice(1, 0, ...customName);

      return base;
   }

   deleteRow = row => {
      loopar.dialog({
         type: 'confirm',
         title: "Confirm",
         message: `Are you sure you want to delete ${row.name}?`,
         ok: async () => {
            await loopar.method(this.meta.__DOCTYPE__.name, 'delete', { documentName: row.name });

            loopar.rootApp.refresh().then(() => {
               loopar.navigate(window.location.pathname);
            });
            
            loopar.notify({
               type: 'success',
               title: "Success",
               message: `Document ${row.name} deleted`
            });
         }
      });
   }

   bulkRemove() {
      const rowsSelected = this.selectedRows;

      loopar.confirm(
         `Are you sure you want to delete ${rowsSelected.join(", ")} documents?`,
         async () => {
            await loopar.method(this.meta.__DOCTYPE__.name, 'bulkDelete', { documentNames: JSON.stringify(rowsSelected) })
            this.search();
         }
      );
   }
}
export const ListGrid = (props) => {
   return React.createElement(ListGridClass, props);
}