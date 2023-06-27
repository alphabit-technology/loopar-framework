import Div from "/components/elements/div.js";
import { a, button, div, Element, i, input, label, small, span, table, tbody, td, th, thead, tr } from "/components/elements.js";

import { element_manage } from "../element-manage.js";
import { avatar } from '/tools/helper.js';
import { Pagination } from "/components/common/pagination.js";
import { loopar } from "/loopar.js";
import { http } from "/router/http.js";
import { elements_dict } from "/element-definition.js";

class BaseTable extends Div {
   selectors = {};
   selector_id = element_manage.uuid();
   data_example = {
      columns_title: [],
      rows: []
   };

   rows_ref = {};
   search_data = {};
   grid_size = "sm";
   form_search = {};

   has_header_options = false

   constructor(props) {
      super(props);

      this.state = {
         ...this.state,
         meta: props.meta,
         selected_rows: [],
         isOpenDropdown: false,
      }
   }

   get rows_inputs() {
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
         ].flat()//.filter(e => e.is_writable);
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
         return this.rows_inputs;
      }
   }

   get selectedRows() {
      return this.state.selected_rows;
   }

   selectRow(row, checked) {
      const selected_rows = checked ? Array.from(new Set([...this.selectedRows, row.name])) : this.selectedRows.filter(r => r !== row.name);

      this.setState({ selected_rows });
   }

   setPage(page) {
      this.current_page = page;
      this.search();
   }

   async search() {
      const res = await http.post(`list`, { q: this.search_data, page: this.current_page || 1, freeze: true }, { freeze: true });
      const meta = this.meta;

      meta.rows = res.meta.rows;
      meta.pagination = res.meta.pagination;
      this.setState({ meta });
   }

   componentDidUpdate() {
      super.componentDidUpdate();
      this.set_selectors_status();
   }

   select_all_visible_rows(checked = true) {
      const selected_rows = checked ? this.rows_inputs.map(r => r.name) : [];

      this.setState({ selected_rows });
      this.set_selectors_status();
   }

   set_selectors_status() {
      const selected_rows = this.selectedRows.length;
      this.selectors.selector_all.node.indeterminate = false;

      if (selected_rows > 0) {
         if (selected_rows === this.rowsCount) {
            this.selectors.selector_all.node.checked = true;
         } else {
            this.selectors.selector_all.node.indeterminate = true;
         }
      } else {
         this.selectors.selector_all.node.indeterminate = false;
         this.selectors.selector_all.node.checked = false;
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

   /*get data(){
      return this.state.data || {};
   }*/

   get rows() {
      return this.meta.rows
      //const data_rows = element_manage.isJSON(this.meta.rows) ? JSON.parse(this.meta.rows) : Array.isArray(this.meta.rows) ? this.meta.rows : [];
      //return data_rows || [];
      //return this.meta.rows || [];
   }

   get rowsCount() {
      return this.rows.length;
   }

   addRow() {
      const rows = this.rows;
      rows.push({ name: element_manage.uuid() });
      this.state.meta.rows = rows;
      this.setState({ meta: this.meta });
   }

   /*toggleDropdown(show) {
      const { isOpenDropdown } = this.state;
      if(show === false && isOpenDropdown === false){
         return;
      }

      this.setState({isOpenDropdown: !isOpenDropdown});
   }*/

   get columns() {
      const base_columns = this.baseColumns().filter(c => c.data.in_list_view);

      return [
         {
            is_added: true,
            rows_props: {
               className: "align-middle col-checker"
            },
            data: {
               name: "selector_all",
               label: () => {
                  const rows_selected = this.selectedRows.length;

                  return div({ className: "thead-dd dropdown" }, [
                     span({ className: "custom-control custom-control-nolabel custom-checkbox" }, [
                        input({
                           type: "checkbox",
                           className: "custom-control-input",
                           "aria-label": "Select all rows",
                           id: this.selector_id,
                           onChange: (e) => {
                              this.select_all_visible_rows(e.target.checked);
                           },
                           ref: self => {
                              this.selectors.selector_all = self;
                           }
                        }),
                        label({
                           className: "custom-control-label",
                           htmlFor: this.selector_id,
                        })
                     ]),
                     div({
                        className: "thead-btn", role: "button",/* onClick:() => this.toggleDropdown(),*/
                        "data-toggle": "dropdown",
                     }, [
                        /*span({className: "selected-row-info text-muted pl-1",}, [
                           rows_selected && rows_selected > 0 ? `${rows_selected} selected ` : ''
                        ]),*/
                        span({ className: "fa fa-caret-down" })
                     ]),
                     div({ className: `dropdown-menu` }, [
                        div({ className: "dropdown-arrow" }),
                        rows_selected && rows_selected > 0 ? [
                           a({ className: "dropdown-item", href: "#", onClick: () => { this.select_all_visible_rows() } }, [
                              `${rows_selected} selected`
                           ]),
                           div({ className: "dropdown-divider" })
                        ] : null,
                        a({ className: "dropdown-item", href: "#", onClick: () => { this.select_all_visible_rows() } }, [
                           "Select all"
                        ]),
                        a({ className: "dropdown-item", href: "#", onClick: () => { this.select_all_visible_rows(false) } }, [
                           "Unselect all"
                        ]),
                        div({ className: "dropdown-divider" }),
                        a({ className: `dropdown-item ${rows_selected === 0 ? 'disabled' : ''}`, href: "#", onClick: () => this.bulkRemove() }, [
                           "Bulk remove"
                        ])
                     ])
                  ])
               },
               value: (row) => {
                  return span({ className: "custom-control custom-control-nolabel custom-checkbox" }, [
                     input({
                        key: row.name + "_selector",
                        type: "checkbox",
                        className: "custom-control-input",
                        id: row.name,
                        onChange: (e) => {
                           this.selectRow(row, e.target.checked);
                        },
                        ref: (self) => this.selectors[row.name] = self
                     }),
                     label({
                        key: row.name + "_selector_label",
                        className: "custom-control-label",
                        htmlFor: row.name
                     })
                  ])
               }
            }
         },
         ...base_columns.filter(col => col.element !== FORM_TABLE),
         {
            className: "align-middle text-right",
            rows_props: {
               className: "align-middle text-right"
            },
            is_added: true,
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

   /*componentDidUpdate(prevProps) {
      super.componentDidUpdate(prevProps);
      if (prevProps.meta !== this.props.meta) {
         this.setState({
            meta: this.props.meta
         });
      }
   }*/

   fieldIsWritable(field) {
      return elements_dict[field.element]?.is_writable;
   }

   render() {
      const columns = this.columns.filter(col => col.data.hidden !== 1 && col.data.in_list_view !== 0);
      const search_fields = this.baseColumns().filter(col => this.fieldIsWritable(col) && [INPUT, TEXTAREA, SELECT, CHECKBOX, SWITCH].includes(col.element) && (col.data.searchable || col.data.name === 'name'));
      const rows = Array.isArray(this.rows) ? this.rows : [];
      const selected_rows_count = this.selectedRows.length;

      this.search_data = (this.meta.q && typeof this.meta.q == "object") ? this.meta.q : {};
      this.rows_ref = {};

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
                     (search_fields.length > 0 && this.has_search_form) ? search_fields.map(c => {
                        const row_props = c.rows_props ?? {};

                        if (c.data.name !== "selector_all") {
                           if (this.fieldIsWritable(c)) {
                              const meta = { ...{ simpleInput: false, withoutLabel: true }, ...c };
                              //const meta = {};

                              meta.data ??= {};
                              meta.data.value = this.search_data[c.data.name] ?? "";
                              meta.data.name = c.data.name;
                              meta.data.label = c.data.label;
                              meta.data.size = "sm";
                              meta.focus = this.currrent_input_search === c.data.name;

                              return div({
                                 key: element_manage.uuid(), ...row_props,
                                 className: "col-xl-2 col-lg-3 col-md-4 col-sm-6"
                              }, [
                                 Element(c.element, {
                                    ref: self => this.form_search[c.data.name] = self,
                                    meta: clone(meta),
                                    ...meta,
                                    onChange: e => {
                                       this.search_data[c.data.name] = e.target.value;
                                       clearTimeout(this.last_search);
                                       this.last_search = setTimeout(() => {
                                          this.currrent_input_search = c.data.name;
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
                           selected_rows_count > 0 ? button({ type: 'button', className: 'btn btn-light text-danger', onClick: () => this.bulkRemove() }, [
                              i({ className: 'oi oi-trash' }),
                              span({ className: 'ml-1' }, `Remove (${selected_rows_count})`)
                           ]) : null,
                           this.is_editable ? button({ type: 'button', className: 'btn btn-light', onClick: () => this.addRow() }, [
                              i({ className: 'oi oi-plus' })
                           ]) : null,
                        ])
                     ]),
                  ])
               ]),
            ]),
            div({ className: 'card-body border-top', style: { overflow: this.overflow || "", ...(this.has_search_form ? { paddingTop: 0 } : {}) } }, [
               table({ className: `table table-${this.grid_size} mb-0 table-hover bordered`, style: {} }, [
                  thead([
                     tr([
                        columns.map(c => {
                           const data = c.data;
                           const props = data.name === "selector_all" ?
                              { className: "col-checker align-middle", style: { maxWidth: 30 } }
                              : { ...(data.name === "name" ? { className: "pl-3" } : {}) };

                           return th(props,
                              typeof data.label == "function" ? data.label() : data.label
                           )
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
                           this.rows_ref[row.name] = {};
                           return tr({ key: element_manage.uuid() }, [
                              columns.map(column => {
                                 const row_props = column.rows_props ?? {};

                                 if (column.data.name === "selector_all") {
                                    return td({ className: "col-checker align-middle", ...row_props }, column.data.value(row));
                                 }

                                 if (this.is_editable && this.fieldIsWritable(column)) {
                                    const props = { ...column };
                                    props.data ??= {};
                                    props.data.value = row[column.data.name];

                                    return td({ key: element_manage.uuid(), ...row_props, },
                                       Element(column.element, {
                                          //key: element_manage.uuid(),
                                          key: row.name + "_" + column.data.name,
                                          meta: clone(props),
                                          withoutLabel: true,
                                          simpleInput: true,
                                          onChange: (e) => {
                                             row[column.data.name] = e.target.value
                                          },
                                          ref: self => {
                                             if (self) {
                                                this.rows_ref[row.name][column.data.name] = self;
                                             }
                                          }
                                       })
                                    );
                                 } else {
                                    return td({ key: element_manage.uuid(), ...row_props }, typeof column.data.value == "function" ? column.data.value(row) : row[column.data.name]);
                                 }
                              })
                           ])
                        })
                  ])
               ]),
            ]),
            div({ className: 'card-footer' }, [
               this.has_footer_options ? [
                  selected_rows_count > 0 ? div({ className: "card-footer-item" }, [
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
               this.has_pagination ? [
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
         selected_rows: []
      }));
   }


   deleteRow(row) {
      this.setState(prevState => {
         const updatedMetaRows = prevState.meta.rows.filter(r => r.name !== row.name);
         const updatedSelectedRows = prevState.selected_rows.filter(r => r !== row.name);

         return {
            meta: {
               ...prevState.meta,
               rows: updatedMetaRows
            },
            selected_rows: updatedSelectedRows
         };
      });
   }
}

export default class FormTable extends BaseTable {
   is_writable = true;
   has_footer_options = true;
   has_pagination = false;
   is_editable = true;
   className = "feed";
   has_header_options = true;

   constructor(props) {
      super(props);
   }

   /*get meta(){
      console.log("Form table getmeta",this.state.meta)
      return this.state.meta.data.value;
   }*/

   validate() {
      return Object.entries(this.rows_ref).reduce((acc, [key, row]) => {
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
}

class ListGridClass extends BaseTable {
   is_writable = false;
   has_footer_options = false;
   has_header_options = false;
   has_pagination = true;
   grid_size = "lg";
   overflow = "auto";
   has_search_form = true;

   style = { height: "100%" };

   constructor(props) {
      super(props);
   }

   get columns() {
      const base = super.columns.filter(col => col.data.name !== "name");

      const custom_name = [
         {
            rows_props: { className: "align-middle text-truncate" },
            is_added: true,
            data: {
               name: "name",
               label: "Name",
               value: row => {
                  return div({ className: "media align-items-center" }, [
                     a({
                        key: row.name + "_avatar",
                        test_element: "avatar",
                        href: `update?document_name=${row.name}`,
                        className: `tile bg-${loopar.bg_color(row.name)} text-white mr-2`
                     }, avatar(row.name)),
                     div({ className: "media-body" }, [
                        a({
                           key: row.name + "_description",
                           href: `update?document_name=${row.name}`
                        }, row.description || row.name),
                        small({ className: "d-block text-muted" }, row.name)
                     ])
                  ]);
               }
            }
         }
      ];

      base.splice(1, 0, ...custom_name);

      return base;
   }

   deleteRow = row => {
      loopar.dialog({
         type: 'confirm',
         title: "Confirm",
         message: `Are you sure you want to delete ${row.name}?`,
         ok: () => {
            http.send({
               action: 'delete',
               params: { document_name: row.name },
               success: (data) => {
                  loopar.root_app.refresh().then(() => {
                     loopar.navigate(window.location.pathname);
                  });
                  loopar.dialog({
                     type: 'success',
                     title: "Success",
                     message: `Document ${row.name} deleted`
                  });
               },
               freeze: true
            });
         }
      });
   }

   bulkRemove() {
      loopar.dialog({
         type: 'info',
         title: "Info",
         message: `Sorry this feature is not available yet`
      });
      /*loopar.dialog({
         type: 'confirm',
         title: "Confirm",
         message: `Are you sure you want to delete ${this.selected_rows.length} documents?`,
         ok: () => {
            http.send({
               action: 'bulk_delete',
               params: {document_names: this.selected_rows},
               success: (data) => {
                  loopar.root_app.refresh().then(() => {
                     loopar.navigate(window.location.pathname);
                  });
                  loopar.dialog({
                     type: 'success',
                     title: "Success",
                     message: `${this.selected_rows.length} documents deleted`
                  });
               }
            });
         }
      });*/
   }
}

export const ListGrid = (props) => {
   return React.createElement(ListGridClass, props);
}