import loopar from "loopar";
import BaseInput from "@base-input"
import {MetaComponent} from "@meta-component";
import _  from "lodash";

import { useFieldArray } from 'react-hook-form';
import { useFormContext } from "@context/form-provider";
import {useRef, useMemo, useCallback, useEffect, memo} from "react";

import { FormWrapper } from "@context/form-provider";
import { TableProvider, useTable } from "./table/TableContext"

import { PlusIcon, Trash2Icon } from "lucide-react";
import { Button } from "@cn/components/ui/button";
import BaseTable from "./table/BaseTable";

import {
  TableCell,
  TableRow,
} from "@cn/components/ui/table";

import { CSS } from '@dnd-kit/utilities';

import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  MouseSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const SortableRow = memo(function SortableRow({ index, row, columns }) {
  const { id } = row;
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });

  console.log("SortableRow",listeners);
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className="p-0 m-0">
      {
        columns.map((col) => {
          const cellProps = col.cellProps || {};
          const { data } = col;

          const draggableProps = col.draggable ? {
            ...listeners,
            ...attributes
          } : {};

          const className = `min-w-40 ${cellProps.className || ""} py-0 px-1`;

          return (
            <TableCell
              key={`${id}-${data.name}-${index}`}
              className={className}
              {...cellProps}
              {...draggableProps}
            >
              {col.render ? col.render(row, index) : row[data.name]}
            </TableCell>
          );
        })
      }
    </TableRow>
  );
});

const MemoizedTableInput = memo(function MemoizedTableInput({ component, cellName, data, register }) {
  return (
    <MetaComponent
      component={component}
      render={(Comp) => (
        <Comp
          dontHaveLabel={true}
          simpleInput={true}
          data={data}
          {...register(cellName)}
        />
      )}
    />
  );
});

const FormTable = (props) => {
  const { selectedRows, bulkRemove, baseColumns, selectorCol } = useTable();
  const { control, register } = useFormContext();

  const { fields, move, remove, append } = useFieldArray({
    control,
    name: 'rows'
  });

  const handleAppend = useCallback(() => {
    append({ id: Date.now(), name: Date.now() });
  }, [append]);

  const handleRemove = useCallback((index) => {
    remove(index);
  }, [remove]);
  
  const mappedColumns = useMemo(() => {
    const baseCols = baseColumns()
      .filter(col => fieldIsWritable(col) && loopar.utils.trueValue(col.data.in_list_view))
      .map((col) => {
        const newCol = { ...col };
        
        if(newCol.data.name === "name") {
          newCol.data.label = null;
          newCol.cellProps = {
            className: "min-w-40 p-2",
          };
        }
        
        newCol.render = (field, index) => {
          const cellName = `rows.${index}.${newCol.data.name}`;
          return (
            <MemoizedTableInput 
              component={newCol.element}
              cellName={cellName}
              data={{ ...newCol.data, name: cellName, label: newCol.data.label }}
              register={register}
            />
          );
        };
        
        return newCol;
      });

    return [
      selectorCol(3),
      {
        data: { name: "index" },
        draggable: true,
        cellProps: {
          className: "min-w-15 max-w-15 p-2 text-center",
        },
        render: (row, idx) => (
          <div 
            className="flex justify-center border-2 rounded-md p-2 drop-shadow-md cursor-move"
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
        cellProps: {
          className: "min-w-10 p-2 text-center",
        },
        render: (row, index) => (
          <Button
            type="button"
            variant="destructive"
            onClick={(e) => {
              e.preventDefault();
              handleRemove(index);
            }}
          >
            <Trash2Icon size={16} />
          </Button>
        ),
      }
    ];
  }, [baseColumns, selectorCol, register, handleRemove]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 100, tolerance: 5 } }),
    useSensor(MouseSensor, { activationConstraint: { delay: 100, tolerance: 5 } })
  );

  const onDragEnd = useCallback((event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = fields.findIndex(f => f.id === active.id);
      const newIndex = fields.findIndex(f => f.id === over.id);
      move(oldIndex, newIndex);
    }
  }, [fields, move]);

  return (
    <div className="feed">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={fields.map(f => f.id)}
          strategy={verticalListSortingStrategy}
        >
          <BaseTable
            {...props}
            rows={fields}
            viewType={"List"}
            hasPagination={false}
            hasHeaderOptions={true}
            columns={mappedColumns}
            rowTemplate={SortableRow}
          />
        </SortableContext>
      </DndContext>
      <div className="flex flex-row gap-2">
        {selectedRows.length > 0 && (
          <Button
            type="button"
            variant="destructive"
            onClick={bulkRemove}
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

const FormTableMiddleware = memo(function FormTableMiddleware({ rows, onChange }) {
  const debounceTimer = useRef(null);
  const prevRows = useRef(rows);

  const saveData = useCallback((newRows) => {
    if (!_.isEqual(newRows.rows, prevRows.current)) {
      prevRows.current = newRows.rows;
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => onChange(newRows.rows), 300);
    }
  }, [onChange]);

  useEffect(() => () => clearTimeout(debounceTimer.current), []);

  return (
    <FormWrapper __DOCUMENT__={{ rows }} onChange={saveData}>
      <FormTable rows={rows} />
    </FormWrapper>
  );
});

export default function FormTableInput(props) {
  const { renderInput } = BaseInput(props);
  const meta = useMemo(() => props.__META__, [props.__META__]);
  const docRef = props.docRef;

  return (
    <TableProvider initialMeta={meta} docRef={docRef}>
      {renderInput(field => {
        const rows = field.value || [];

        const handleChange = useCallback((newRows) => {
          field.onChange({ target: { value: newRows } });
        }, [field]);

        return (
          <FormTableMiddleware
            rows={rows}
            onChange={handleChange}
          />
        );
      })}
    </TableProvider>
  );
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