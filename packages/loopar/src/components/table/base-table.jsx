import Component from "@component";
import elementManage from "@@tools/element-manage";
import {Pagination} from "@pagination";
import loopar from "loopar";
import {MetaComponent} from "@meta-component";
import { Link } from "@link";
import { FormWrapper } from "@context/form";

import {
  Avatar,
  AvatarFallback
} from "@cn/components/ui/avatar"

import { TrashIcon } from 'lucide-react';
import { Button } from "@cn/components/ui/button";
import { Badge } from "@cn/components/ui/badge";
import { PencilIcon, Trash2Icon, ChevronDownIcon, AlertTriangleIcon } from 'lucide-react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@cn/components/ui/table"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@cn/components/ui/card"

import { Checkbox } from "@cn/components/ui/checkbox"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@cn/components/ui/dropdown-menu"

export class BaseTable extends Component {
  selectors = {};
  selectorId = elementManage.uuid();
  dataExample = {
    columns_title: [],
    rows: [],
  };

  rowsRef = {};
  //searchData = {};
  gridSize = "sm";
  formSearch = {};

  hasHeaderOptions = false;

  constructor(props) {
    super(props);
    const meta = props.meta;

    this.state = {
      ...this.state,
      meta: meta,
      selectedRows: [],
      isOpenDropdown: false,
      searchData: meta && meta.q && typeof meta.q == "object" ? meta.q : {},
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
        }),
      ].flat(); //.filter(e => e.isWritable);
    };

    const STRUCTURE = JSON.parse(meta.__ENTITY__?.doc_structure || "[]");

    return els(STRUCTURE || []);
  }

  get selectedRows() {
    return this.state.selectedRows;
  }

  selectRow(row, checked) {
    const selectedRows = checked
      ? Array.from(new Set([...this.selectedRows, row.name]))
      : this.selectedRows.filter((r) => r !== row.name);

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
    await loopar.method(
      this.meta.__ENTITY__.name,
      this.docRef.action || this.meta.action,
      {},
      {
        body: {
          q: this.state.searchData,
          page: this.pagination.page || 1,
        },
        success: (res) => {
          this.setState(
            {
              meta: res,
            },
            () => {
              this.setSelectorsStatus();
            }
          );
        }
      }
    );

    /*this.setState(
      {
        meta: res.meta,
      },
      () => {
        this.setSelectorsStatus();
      }
    );*/
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    super.componentDidUpdate(prevProps, prevState, snapshot);
    if (this.props.meta !== prevProps.meta) {
      this.setState({
        meta: this.props.meta,
      });

      return;
    }

    //this.setSelectorsStatus();
  }

  get viewType() {
    return (this.props.viewType === "List" && this.docRef.onlyGrid !== true) ||
      this.isEditable
      ? "List"
      : "Grid";
  }

  setSelectorsStatus() {
    const selectedRows = this.selectedRows.length;
    const selectorAll = this.selectors.selector_all;

    if (selectorAll) {
      const node = selectorAll.node;
      if (!node) return;
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
        selector.node &&
          (selector.node.checked = !!this.selectedRows.find(
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
   *   __ENTITY__: {}
   *   rows: []
   * }
   */
  get meta() {
    return this.state.meta || {};
  }

  get rows() {
    return this.meta?.rows || [];
  }

  get rowsCount() {
    return this.rows.length;
  }

  get mappedColumns() {
    const baseColumns = this.baseColumns().filter((c) => c.data.in_list_view);

    return [
      ...baseColumns.filter((col) => col.element !== FORM_TABLE),
      {
        className: "align-middle text-right",
        rowsProps: {
          className: "align-middle text-right",
        },
        cellProps: {
          style: { width: 50 },
          className: "align-middle text-center",
        },
        isCustom: true,
        data: {
          name: "actions",
          label: "",
          value: (row) => {
            return (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.preventDefault();
                  this.deleteRow(row);
                }}
              >
                <TrashIcon className="text-red-500" />
              </Button>
            );
          },
        },
      },
    ];
  }

  getColumns() {
    const mappedColumns = this.mappedColumns;
    const docRefMappedColumns = this.docRef?.mappedColumns || [];

    return mappedColumns.map((col) => {
      const mapped = docRefMappedColumns.find(
        (c) => c.data.name === col.data.name
      );

      if (mapped) {
        return {
          ...col,
          ...mapped,
        };
      }

      return col;
    });
  }

  getRenderColumns(columns, row) {
    return columns.map((column) => {
      const cellProps = column.cellProps ?? {};
      const data = column.data;

      return (
        <TableCell
          className='align-middle'
          key={`${row.name}_${data.name}_td`}
          {...cellProps}
        >
          {typeof data.value == "function" ? data.value(row) : row[data.name]}
        </TableCell>
      );
    })
  }

  getRenderRows(columns, rows) {
    return rows.map((row) => {
      this.rowsRef[row.name] = {};

      return (
        <TableRow hover role="checkbox" tabIndex={-1} key={"row" + row.name}>
          <TableCell padding="checkbox" className="w-10">
            <Checkbox
              onCheckedChange={(event) => {
                this.selectRow(row, event);
              }}
              checked={this.selectedRows.includes(row.name)}
            />
          </TableCell>
          {this.getRenderColumns(columns, row)}
        </TableRow>
      );
    })
  }

  popPopRowActions(selectorAllStatus, rowsCount, selectedRows) {
    return <DropdownMenu>
      <div className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 py-2 px-2">
        <>
          <Checkbox
            checked={selectorAllStatus}
            onCheckedChange={(event) => {
              this.selectAllVisibleRows(event);
            }}
          />
          <DropdownMenuTrigger asChild className="p-1" >
            <div className="flex flex-row pl-2 align-middle">
              {selectedRows > 0 && <p className="flex items-center justify-center">Selected {selectedRows}</p>}
              <ChevronDownIcon className="ml-1" />
            </div>
          </DropdownMenuTrigger>
        </>
      </div>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={rowsCount === selectedRows} onClick={()=>{this.selectAllVisibleRows(true)}}>
            Select All
          </DropdownMenuItem>
          <DropdownMenuItem disabled={selectedRows <= 0} onClick={()=>{this.selectAllVisibleRows(false)}}>
            Unselect All
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem disabled={selectedRows <= 0} onClick={()=>{this.bulkRemove()}}>Bulk Remove</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  }

  getTableRender(columns, rows) {
    columns = columns.filter(
      (c) => !this.hiddenColumns.includes(c.data.name)
    );

    const rowsCount = rows.length;
    const selectedRows = this.selectedRows.length;

    const selectorAllStatus = (rowsCount > 0 && selectedRows > 0 && selectedRows < rowsCount) ? "indeterminate" :
      rowsCount > 0 && selectedRows === rowsCount;

    return (
      <Table stickyHeader aria-label="sticky table">
        <TableHeader className="bg-slate-300/50 dark:bg-slate-800/50">
          <TableRow>
            <TableHead padding="checkbox" className="w-10 p-2" colSpan={2}>
              {this.popPopRowActions(selectorAllStatus, rowsCount, selectedRows)}
            </TableHead>
            {columns.map((c) => {
              if(c.data.name === "name") {
                return null
              }

              const data = c.data;
              const cellProps = c.cellProps ?? {};

              return (
                <TableCell {...cellProps}>
                  {typeof data.label == "function" ? data.label() : data.label ? loopar.utils.UPPERCASE(data.label) : "..."}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length+2}>
                <div className="flex flex-col bg-background w-full p-3 place-items-center">
                  <AlertTriangleIcon className="w-10 h-10"/>
                  <div className="text-lg">No rows to show</div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            this.getRenderRows(columns, rows)
          )}
        </TableBody>
      </Table>
    );
  }

  get docRef() {
    return this.props.docRef || {};
  }

  getGridRender(rows) {
    const defaultAction = (row) => {
      if(["Entity", "Builder"].includes(row.type || this.name)) return row.is_single ? "update" : "list";
      if(["Page Builder", "View Builder"].includes(row.type)) return "view";
    }

    return (
      <div className="justify flex flex-wrap gap-3 border p-2">
        {
          rows.length === 0 ? (
            <div className="flex flex-col bg-background w-full p-3 place-items-center">
              <AlertTriangleIcon className="w-10 h-10"/>
              <div className="text-lg">No items to show</div>
            </div>
          ) : 
          rows.map((row) => {
            const action = defaultAction(row);
            const color = loopar.bgColor(row.name);

            return this.docRef.gridTemplate ? (
              this.docRef.gridTemplate(row, action, () => {this.selectRow(row, action, !this.selectedRows.includes(row.name))})
            ) : (
              <div>
                <Card className="w-full min-w-[300px]">
                  <CardHeader>
                    <CardDescription>
                      <Badge
                        variant="secondary"
                        className="bg-secondary text-white"
                      >
                        {row.type}
                      </Badge>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="justify-left flex gap-3">
                      <Avatar className={`rounded-3 h-14 w-14`} style={{ backgroundColor: color }}>
                        <AvatarFallback className={`bg-transparent text-2xl font-bold`}>{loopar.utils.avatar(row.name)}</AvatarFallback>
                      </Avatar>
                      <p>
                        <h4>{row.name}</h4>
                        <h6 className='font-bold text-slate-500 dark:text-slate-400'>{row.module}</h6>
                      </p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        e.preventDefault();
                        this.deleteRow(row);
                      }}
                    >
                      <Trash2Icon className="mr-2" />
                      Delete
                    </Button>
                    <Link
                      variant="outline"
                      to={`update?name=${row.name}`}
                    >
                      <PencilIcon className="mr-2" />
                      Update
                    </Link>
                  </CardFooter>
                </Card>
              </div>
            )
          })
        }
      </div>
    );
  }

  get name() {
    return this.props.meta.__ENTITY__.name;
  }

  get hiddenColumns() {
    return this.props.docRef?.hiddenColumns || [];
  }

  conciliateSelectedRows() {
    const selectedRows = this.selectedRows;
    const rowsNames = this.rows.map((row) => row.name);

    this.state.selectedRows = selectedRows.filter((row) =>
      rowsNames.includes(row)
    );
  }
  get _hasSearchForm() {
    return this.props.hasSearchForm ?? this.hasSearchForm;
  }

  getFormSearch(searchFields) {
    return (
      <FormWrapper>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {searchFields.length > 0 && this._hasSearchForm && searchFields.map((c) => {
            if (c.data.name !== "selector_all") {
              if (fieldIsWritable(c)) {
                const data = {
                  ...{
                    simpleInput: false,
                    withoutLabel: true,
                  },
                  ...c.data,
                  required: 0,
                };

                const searchData = this.state.searchData;

                data.value = searchData[c.data.name] ?? "";
                data.name = c.data.name;
                data.label = c.data.label;
                data.size = "sm";
                
                return (
                  <MetaComponent
                    component={c.element}
                    render={Component => (
                      <Component
                        data={{
                          ...data,
                          key: c.data.name,
                        }}
                        value={data.value}
                        dontHaveForm={true}
                        dontHaveLabel={true}
                        onChange={(e) => {
                          const value = (e && e.target) ? e.target.value : e;

                          if (value) {
                            searchData[c.data.name] = `${value}`;
                          } else {
                            delete searchData[c.data.name];
                          }

                          this.setState({ searchData }, () => {
                            clearTimeout(this.lastSearch);
                            this.lastSearch = setTimeout(() => {
                              this.search();
                            }, [SELECT, SWITCH, CHECKBOX].includes(c.element) ? 0: 300);
                          });
                        }}
                      />
                    )}
                  />
                )
                /*return (
                  <div>
                    <MetaComponent
                      component={c.element}
                      data={data}
                      render={(field, data) => {
                        return 
                        elements={[                   
                        {
                          element: c.element,
                          key: c.data.name,
                          data,
                          dontHaveForm: true,
                          dontHaveLabel: true,
                          onChange: (e) => {
                            console.log(e);
                            const value = e?.target?.value || e//e.target ? e.target.value : e;

                            if (value) {
                              searchData[c.data.name] = `${value}`;
                            } else {
                              delete searchData[c.data.name];
                            }

                            this.setState({ searchData }, () => {
                              clearTimeout(this.lastSearch);
                              this.lastSearch = setTimeout(() => {
                                this.search();
                              }, [SELECT, SWITCH, CHECKBOX].includes(c.element) ? 0: 300);
                            });
                          }
                        }
                      ]}
                      parent={this}
                    />
                  </div>
                );*/
              }
            }
          })
          }
        </div>
      </FormWrapper>
    );
  }

  getAvailableColumns() {
    return this.getColumns().filter(
      (col) => col.data.hidden !== 1 && col.data.in_list_view !== 0
    );
  }

  getSearchableColumns() {
    return this.baseColumns().filter(
      (col) =>
        fieldIsWritable(col) &&
        [INPUT, TEXTAREA, SELECT, CHECKBOX, SWITCH].includes(col.element) &&
        (col.data.searchable || col.data.name === "name")
    );
  }

  render() {
    const columns = this.getAvailableColumns();
    const searchFields = this.getSearchableColumns();
    const rows = this.rows;
    this.conciliateSelectedRows();
    const selectedRowsCount = this.selectedRows.length;

    //this.searchData = this.meta.q && typeof this.meta.q == "object" ? this.meta.q : {};
    this.rowsRef = {};

    const setPage = (page) => {
      this.pagination.page = page;
      this.search();
    };

    return (
      <>
        {this._hasSearchForm && <div>{this.getFormSearch(searchFields)}</div>}
        <div className="border">
          {this.viewType === "List" ? this.getTableRender(columns, rows) : this.getGridRender(rows)}
        </div>
        <div spacing={3}>
          {this.getFooter()}
          {this.hasPagination ? (
            <Pagination pagination={this.pagination} setPage={setPage} app={this} />
          ) : null}
        </div>
      </>
    );
  }

  getFooter(){
    return null;
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
        rows: updatedRows,
      },
      selectedRows: [],
    }), () => {
      this.onDeleteRow && this.onDeleteRow();
    });
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
          rows: updatedMetaRows,
        },
        selectedRows: updatedSelectedRows,
      };
    }, () => {
      this.onDeleteRow && this.onDeleteRow();
    });
  }
}