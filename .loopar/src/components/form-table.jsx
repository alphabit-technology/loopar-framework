import {BaseTable} from "@base-table"
import BaseInput from "@base-input"
import {MetaComponent} from "@meta-component";
import pkg from "lodash";
const { cloneDeep } = pkg;
import { DesignerContext } from "@context/@/designer-context";
import { useDocument } from "@context/@/document-context";
import { AlertTriangleIcon } from "lucide-react";

import elementManage from "@tools/element-manage";
import loopar from "loopar";


import { Checkbox } from "@/components/ui/checkbox"

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

class FormTableClass extends BaseTable {
  hasFooterOptions = true;
  hasPagination = false;
  className = "feed";
  hasHeaderOptions = true;
  viewType = "List";
  __REFS__ = {};

  get mappedColumns() {
    return super.mappedColumns.map((col) => {
      if (col.data.name === "actions") {
        col.cellProps.className += " pt-0";
      }
      return col;
    });
  }

  onDeleteRow() {
    const meta = this.meta;
    this.props.onChange({target: {value: meta}});
  }

  addRow() {
    const rows = this.rows;
    const maxId = loopar.utils.getArrayMax(rows, "id") || 0;

    rows.push({ id: maxId + 1, name: elementManage.uuid() });
    this.state.meta.rows = rows;
    this.setState({ meta: this.meta });
  }

  getRenderColumns(columns, row) {
    return columns.map((column) => {
      const cellProps = column.cellProps ?? {};

      const handleInputChange = (row, column, value) => {
        row[column.data.name] = value;
        const meta = this.meta;
        meta.rows.find(r => r.name === row.name)[column.data.name] = value;
        this.props.onChange({target: {value: meta}});
      }

      if (fieldIsWritable(column)) {
        const cellName = row.name + "_" + column.data.name;
        
        return (
          <TableCell
            {...cellProps}
            key={cellName + "_cell"}
          >
            <MetaComponent
              component={column.element}
              render={Comp => (
                <Comp
                  key={cellName + "_input"}
                  dontHaveForm={true}
                  dontHaveLabel={true}
                  simpleInput={true}
                  data={cloneDeep({
                    ...cloneDeep(column.data),
                    name: cellName,
                    value: row[column.data.name],
                    label: column.data.label,
                  })}
                  onChange={(e) => {
                    clearTimeout(this.lastUpdate);
                    this.lastUpdate = setTimeout(() => {
                      handleInputChange(row, column,  e.target.value);
                    }, [SELECT, SWITCH, CHECKBOX].includes(column.element) ? 0: 300);
                  }}
                />
              )}
            />
          </TableCell>
        );
      }else if (column.data.name === "actions") {
        return (
          <TableCell
            {...cellProps}
            key={column.name}
          >
            <Button
              type="button"
              variant="destructive"
              onClick={() => this.deleteRow(row)}
            >
              <Trash2Icon size={16} />
            </Button>
          </TableCell>
        );
      }
    })
  }

  getRenderRows(columns, rows) {
    return rows.map((row) => {
      this.rowsRef[row.name] = {};

      return (
        <TableRow
          hover
          role="checkbox"
          tabIndex={-1} key={"row" + row.name}
          draggable
          onDragStart={(e) => {
            e.stopPropagation();
            console.log("drag start");
          }}
        >
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
        <TableBody
          droppable
          onDragEnter={(e) => {
            e.preventDefault();
            console.log("drag enter");
          }}
        >
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

  getFooter(){
    const selectedRowsCount = this.selectedRows.length;
    
    return (
      <div className="flex flex-row gap-2">
        {selectedRowsCount > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => this.bulkRemove()}
          >
            <Trash2Icon className="mr-1" size={16} />
            Remove
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={() => this.addRow()}
        >
          <PlusIcon className="mr-1" size={16} />
          Add row
        </Button>
      </div>
    );
  }

  validate() {
    return Object.entries(this.__REFS__).reduce((acc, [key, field]) => {
      return acc.concat(
        field?.validate()
      );
    }, []);
  }

  /*validate() {
    return Object.entries(this.rowsRef).reduce((acc, [key, row]) => {
      return acc.concat(
        Object.values(row)
          .map((el) => {
            return el?.validate();
          })
          .filter((el) => !el?.valid)
          .map((el) => {
            return {
              message: "Row " + key + " " + el.message,
              valid: el.valid,
            };
          })
      );
    }, []);
  }*/
}

export default function FormTable (props) {
  const { renderInput, value } = BaseInput(props);

  const handleChange = (e) => {
    value(e.target.value);
  }

  return renderInput(field => {
    return (
      <DesignerContext.Provider value={{}}>
        <FormTableClass
          field={field}
          meta={field.value}
          onChange={handleChange}
        />
      </DesignerContext.Provider>
    )
  });

  /*validate() {
    return this.formRefTable?.validate();
  }*/
}
 
FormTable.metaFields = ()=>{
  return [
    {
      group: "form",
      elements: {
        options: {
          element: TEXTAREA,
        },
      },
    },
  ];
}