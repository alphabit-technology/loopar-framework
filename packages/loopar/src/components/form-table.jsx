import loopar from "loopar";
import BaseInput from "@base-input"
import {MetaComponent} from "@meta-component";
import _ from "lodash";

import { useFieldArray } from 'react-hook-form';
import { useFormContext } from "@context/form-provider";
import {useRef, useMemo, useCallback} from "react";

import { FormWrapper } from "@context/form-provider";
import { TableProvider, useTable } from "./table/TableContext"

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@cn/components/ui/button";
import BaseTable from "./table/BaseTable";

const FormTable = (props) => {
  const { addRow, selectedRows, bulkRemove, baseColumns, selectorCol} = useTable();

  const viewType = "List";
  const hasPagination = false;
  const className = "feed";
  const hasHeaderOptions = true;
  const {control, register} = useFormContext();

  const { fields, remove } = useFieldArray({
    control,
    name: 'rows'
  });

  const handleRemove = useCallback((index) => {
    remove(index);
  }, [remove]);

  const mappedColumns = useCallback(() => {
    const baseCols = baseColumns()
      .filter(col => fieldIsWritable(col) && loopar.utils.trueValue(col.data.in_list_view))
      .map((col, index) => {
        if(col.data.name === "name") {
          //because first column is selector and spands 2 columns
          col.data.label = null
        }
        col.render = (field, index) => {
          const cellName = `rows.${index}.${col.data.name}`;
          return (
            <MetaComponent
              key={cellName}
              component={col.element}
              render={(Comp) => (
                <Comp
                  dontHaveLabel={true}
                  simpleInput={true}
                  data={{ ...col.data, name: cellName, label: col.data.label }}
                  {...register(`rows.${index}.${col.data.name}`)}
                />
              )}
            />
          );
        };
      return col;
    });

    return [
      selectorCol,
      ...baseCols,
      {
        data: {
          name: "actions",
          label: "...",
        },
        headProps: {
          className: "w-10 p-2 text-center",
        },
        render: (row) => {
          return (
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                deleteRow(row);
              }}
            >
              <Trash2Icon className="text-red-500" />
            </Button>
          );
        },
      }
    ]
  }, [baseColumns, register, handleRemove]);

  const renderFooter = useCallback(() => {
    const selectedRowsCount = selectedRows.length;
    return (
      <div className="flex flex-row gap-2">
        {selectedRowsCount > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={bulkRemove}
          >
            <Trash2Icon className="mr-1" size={16} />
            Remove
          </Button>
        )}
        <Button type="button" variant="primary" onClick={addRow}>
          <PlusIcon className="mr-1" size={16} />
          Add row
        </Button>
      </div>
    );
  }, [selectedRows, bulkRemove, addRow]);

  const customMappedColumns = useMemo(() => {
    const baseCols = mappedColumns() || [];
    return baseCols.map((col, index) => {
      if (col.data.name === "actions") {
        col.render = (field, index) => (
          <Button type="button" variant="destructive" onClick={() => handleRemove(index)}>
            <Trash2Icon size={16} />
          </Button>
        );
      }
      return col;
    });
  }
  , [baseColumns, handleRemove]);

  return (
    <div className={className}>
      <BaseTable
        {...props}
        rows={fields}
        viewType={viewType}
        hasPagination={hasPagination}
        hasHeaderOptions={hasHeaderOptions}
        columns={customMappedColumns}
        renderFooter={renderFooter}
      />
      <div className="flex flex-row gap-2">
        {selectedRows.length > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={() => bulkRemove()}
          >
            <Trash2Icon className="mr-1" size={16} />
            Remove
          </Button>
        )}
        <Button
          type="button"
          variant="primary"
          onClick={addRow}
        >
          <PlusIcon className="mr-1" size={16} />
          Add row
        </Button>
      </div>
    </div>
  );
};

function FormTableMildware(props) {
  const { onChange } = props;
  const {rows} = useTable();

  const debounceTimer = useRef(null);
  const saveData = useCallback((data) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      onChange(data.rows);
    }, 300);
  }, []);
  
  return (
    <FormWrapper __DOCUMENT__={{rows: rows}} onChange={saveData}>
      <FormTable
        rows={rows}
        onChange={saveData}
      />
    </FormWrapper>
  );
}

export default function FormTableInput (props) {
  const { renderInput } = BaseInput(props);
  const valueRef = useRef(null);
  
  const meta = useMemo(() => {
    return props.__META__;
  }, [props.__META__]);

  return renderInput(field => {
    valueRef.current = field.value;
    const handleChange = (e) => {
      !_.isEqual(valueRef.current, e) && field.onChange({target: { value: e }});
    }

    const rows = useMemo(() => {
      return field.value || [];
    }, [field.value]);

    return (
      <TableProvider initialMeta={meta} docRef={props.docRef} rows={rows}>
        <FormTableMildware field={field} onChange={handleChange}/>
      </TableProvider>
    );
  })
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