import loopar from "loopar";
import BaseInput from "@base-input"
import {MetaComponent} from "@meta-component";
import _ from "lodash";

import { useFieldArray } from 'react-hook-form';
import { useFormContext } from "@context/form-provider";
import {useRef, useMemo, useCallback, useEffect} from "react";

import { FormWrapper } from "@context/form-provider";
import { TableProvider, useTable } from "./table/TableContext"

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@cn/components/ui/button";
import BaseTable from "./table/BaseTable";

const FormTable = (props) => {
  const { selectedRows, bulkRemove, baseColumns, selectorCol} = useTable();

  const viewType = "List";
  const hasPagination = false;
  const className = "feed";
  const hasHeaderOptions = true;
  const {control, register} = useFormContext();

  const { fields, move, remove, append } = useFieldArray({
    control,
    name: 'rows'
  });

  const handleAppend = useCallback(() => {
    append({id: fields.length + 1, name: Date.now()});
  }, [append]);

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
      selectorCol(3),
      {
        data: { name: "index" },
        draggable: true,
        onDragStart: (e, rowIndex, rowRefs) => {
          e.stopPropagation();
          const rowEl = rowRefs.current[rowIndex];
          if (rowEl) {
            const rect = rowEl.getBoundingClientRect();
            const offsetX = e.clientX - rect.left;
            const offsetY = e.clientY - rect.top;
            e.dataTransfer.setDragImage(rowEl, offsetX, offsetY);
          }
        },
        cellProps: {
          className: "w-15 p-2 text-center",
        },
        render: (row, idx) => (
          <div 
            className="flex justify-center border-2 rounded-md p-2 drop-shadow-md"
          >
            <span>{idx + 1}</span>
          </div>
        ),
      },
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
        sortable={true}
        move={move}
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
          onClick={handleAppend}
        >
          <PlusIcon className="mr-1" size={16} />
          Add row
        </Button>
      </div>
    </div>
  );
};

function FormTableMiddleware(props) {
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
        //onChange={saveData}
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
    const valueRef = useRef(field.value);

    useEffect(() => {
      valueRef.current = field.value;
    }, [field.value]);

    const handleChange = (e) => {
      !_.isEqual(valueRef.current, e) && field.onChange({target: { value: e }});
    }

    const rows = useMemo(() => {
      return field.value || [];
    }, [field.value]);

    return (
      <TableProvider initialMeta={meta} docRef={props.docRef} rows={rows}>
        <FormTableMiddleware field={field} onChange={handleChange}/>
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