import {BaseTable} from "@@table/base-table"
import BaseInput from "@base-input"
import {MetaComponent} from "@meta-component";
import { DesignerContext } from "@context/@/designer-context";
import { AlertTriangleIcon } from "lucide-react";
import elementManage from "@@tools/element-manage";
import loopar from "loopar";
import { FormWrapper } from "@context/form-provider";
import _ from "lodash";

import { useFieldArray } from 'react-hook-form';
import { useFormContext } from "@context/form-provider";

import { Checkbox } from "@cn/components/ui/checkbox"
import {useRef, useMemo, useCallback} from "react";

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

function FormTableBase({columns, onChange, ...props}) {
  const {control, register} = useFormContext();

  const { fields } = useFieldArray({
    control,
    name: 'rows'
  });

  return fields.map((field, index) => (
    <TableRow>
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
          const cellName = `rows.${index}.${column.data.name}`;
          
          return (
            <TableCell
              {...cellProps}
            >
              <MetaComponent
                component={column.element}
                render={(Comp) => (
                  <Comp
                    dontHaveLabel={true}
                    simpleInput={true}
                    data={({
                      ...column.data,
                      name: cellName,
                      label: column.data.label,
                    })}
                    {...register(`rows.${index}.${column.data.name}`)}
                    value={field[column.data.name]}
                    onChange={onChange}
                  />
                )}
              />
            </TableCell>
          );
        }else if (column.data.name === "actions") {
          return (
            <TableCell
              {...cellProps}
              className="w-10"
            >
              <Button
                type="button"
                variant="destructive"
                onClick={() => props.deleteRow(index)}
              >
                <Trash2Icon size={16} />
              </Button>
            </TableCell>
          );
        }
      })}
    </TableRow>
  ));
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
                <TableCell 
                  {...cellProps}
                  key={data.name + "_header"}
                >
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
            <FormTableBase 
              columns={columns} 
              rows={rows} 
              onChange={this.props.onChange}
              deleteRow={this.props.deleteRow}
            />
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

function FormTable(props) {
  const { meta, field, onChange } = props;
  const debounceTimer = useRef(null);
  const formRef = useRef(null);

  const rows = useMemo(() => {
    return field.value || [];
  }, [field.value]);

  const addRow = () => {
    const newRows =  [...rows]
    const maxId = loopar.utils.getArrayMax(newRows, "id") || 0;

    newRows.push({ id: maxId + 1, name: elementManage.uuid() });
    onChange(newRows);
  }

  const deleteRow = (index) => {
    const newRows =  [...rows]
    newRows.splice(index, 1);
    onChange(newRows);
  }

  const getFormValue = useCallback(() => {
    const newData = formRef.current.watch();
    return Object.values(newData?.rows);
  }, []);
  
  const saveData = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      onChange(getFormValue());
    }, 300);
  }, []);
  
  return (
    <FormWrapper __DOCUMENT__={{rows: rows}} formRef={formRef}>
      <FormTableClass
        meta={meta}
        rows={rows}
        onChange={saveData}
        addRow={addRow}
        deleteRow={deleteRow}
      />
    </FormWrapper>
  );
}

export default function FormTableInput (props) {
  const { renderInput } = BaseInput(props);
  
  const meta = useMemo(() => {
    return props.__META__;
  }, [props.__META__]);

  return renderInput(field => {
    const handleChange = (e) => {
      !_.isEqual(field.value, e) && field.onChange({target: { value: e }});
    }

    return (
      <DesignerContext.Provider value={{}}>
        <FormTable
          key={field.name}
          field={field}
          meta={meta}
          onChange={handleChange}
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