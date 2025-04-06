import {BaseTable} from "@@table/base-table"
import BaseInput from "@base-input"
import {MetaComponent} from "@meta-component";
import pkg from "lodash";
const { cloneDeep } = pkg;
import { DesignerContext } from "@context/@/designer-context";
import { AlertTriangleIcon, Footprints } from "lucide-react";
import elementManage from "@@tools/element-manage";
import loopar from "loopar";
import { FormWrapper } from "@context/form-provider";
import _ from "lodash";

import { Checkbox } from "@cn/components/ui/checkbox"
import {useRef, useState, useEffect, use, useMemo, useCallback} from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@cn/components/ui/table"

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@cn/components/ui/button";

function FormTableInput({ column, name, inputName, onChange, ...props }) {
  const formRef = useRef(null);
  const prevData = useRef(null);
  const debounceTimer = useRef(null);
  const data = useMemo(() => props.data, [props.data]);

  const getFormValue = useCallback(() => {
    const newData = formRef.current.watch();
    return Object.values(newData)[0];
  }, []);

  const saveData = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      const newData = getFormValue();

      if (prevData.current !== newData) {
        onChange(inputName, newData);
        prevData.current = newData;
      }
    }, 300);
  }, [inputName, onChange]);

  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return (
    <FormWrapper __DOCUMENT__={data} formRef={formRef}>
      <MetaComponent
        component={column.element}
        key={`${name}_input`}
        render={(Comp) => (
          <Comp
            //key={`${name}_input`}
            dontHaveLabel={true}
            simpleInput={true}
            data={cloneDeep({
              ...column.data,
              name,
              label: column.data.label,
            })}
            value={getFormValue()}
            onChange={saveData}
          />
        )}
      />
    </FormWrapper>
  );
}

function FormTableRow ({rowId, columns, currentSelect, onSelect, onChange, ...props}) {
  const row = useMemo(() => {
    return props.row;
  }, [props.row]);

  const [rowData, setRowData] = useState(row);
  const prevData = useRef({ ...rowData });

  const updateRowData = useCallback((name, value) => {
    const newRowData = { ...rowData, [name]: value };
    if (!_.isEqual(prevData.current, newRowData)) {
      prevData.current = newRowData;
      setRowData(newRowData);
      onChange(rowId, newRowData);
    }
  }, [rowData, onChange, rowId]);

  return (
    <TableRow
      hover
      role="checkbox"
      tabIndex={-1}
      key={"row___" + row.name}
      draggable
      onDragStart={(e) => {
        e.stopPropagation();
        //console.log("drag start");
      }}
    >
      <TableCell padding="checkbox" className="w-10">
        <Checkbox
          onCheckedChange={(event) => {
            //onSelect(row, event);
            //this.selectRow(row, event);
          }}
          //checked={this.selectedRows.includes(row.name)}
        />
      </TableCell>
      {columns.map((column) => {
        const cellProps = column.cellProps ?? {};

        if (fieldIsWritable(column)) {
          const cellName = row.name + "_" + column.data.name;
          
          return (
            <TableCell
              {...cellProps}
              key={cellName + "_cell"}
            >
              <FormTableInput
                key={cellName + "_input"}
                column={column}
                inputName={column.data.name}
                data={{[cellName]: row[column.data.name]}}
                name={cellName}
                onChange={updateRowData}
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
      })}
    </TableRow>
  )
}

function FormTableBase({columns, rows, onChange}) {
  const initialRowsMap = useMemo(() => {
    return rows.reduce((acc, row) => {
      acc[row.name] = row;
      return acc;
    }, {});
  }, [rows]);

  const prevRows = useRef({ ...initialRowsMap });

  const updateRows = useCallback((index, newRow) => {
    const newRows = { ...initialRowsMap, [index]: newRow };
    if (!_.isEqual(prevRows.current, newRows)) {
      prevRows.current = newRows;
      onChange(Object.values(newRows));
    }
  }, [rows]);

  return Object.entries(initialRowsMap).map(([key, row]) => {
    return (
      <FormTableRow
        rowId={row.name}
        key={row.name + "__row"}
        row={row}
        columns={columns}
        //currentSelect={this.selectedRows}
        onSelect={(row, event) => {
          //this.selectRow(row, event);
        }}
        onChange={updateRows}
      />
    );
  })
}

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
    if(this.props.addRow) {
      return this.props.addRow();
    }

    const rows = this.rows;
    const maxId = loopar.utils.getArrayMax(rows, "id") || 0;

    rows.push({ id: maxId + 1, name: elementManage.uuid() });
    this.state.meta.rows = rows;
    this.setState({ meta: this.meta });
  }

  getRenderRows(columns, rows) {
    return (
      <FormTableBase columns={columns} rows={rows} onChange={this.props.onChange}/>
    )
  }

  getTableRender(columns, rows) {
    rows = this.props.rows || []

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
}

export default function FormTable (props) {
  const { renderInput } = BaseInput(props);
  const prevRows = useRef({});

  const meta = useMemo(() => {
    return props.__META__;
  }, [props.__META__]);

  return renderInput(field => {
    const rows = useMemo(() => {
      return field.value
    }, [field.value]);

    const handleChange = (e) => {
      if(!_.isEqual(prevRows.current, e)) {
        field.onChange({target: { value: e }});
        prevRows.current = prevRows;
      }
    }

    const addRow = () => {
      const newRows =  [...rows]
      const maxId = loopar.utils.getArrayMax(newRows, "id") || 0;

      newRows.push({ id: maxId + 1, name: elementManage.uuid() });
      handleChange(newRows);
    }

    return (
      <DesignerContext.Provider value={{}}>
        <FormTableClass
          field={field}
          meta={meta}
          rows={rows}
          onChange={handleChange}
          addRow={addRow}
        />
      </DesignerContext.Provider>
    )
  });
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