import loopar from "loopar";
import {Link} from "@link";
import { TableProvider, useTable } from "./TableContext"
import BaseTable from "./BaseTable"
import {useCallback, useMemo} from "react";
import {Trash2Icon} from "lucide-react";

import {
  Avatar,
  AvatarFallback
} from "@cn/components/ui/avatar"

import { Button } from "@cn/components/ui/button";
import { Badge } from "@cn/components/ui/badge";
import { TableSearch } from "./TableSearch";

function ListGridMiddleware(props) {
  const { docRef } = props;
  const {baseColumns, meta, setRows, selectorCol} = useTable();

  const getDocumentTitle = (row) => {
    const titleFields = meta.__ENTITY__.title_fields?.split(",");

    if(titleFields){
      return titleFields.map((field) => row[field]).join(" ");
    }

    return row.name;
  }

  const mappedColumns = useCallback(() => {
    return baseColumns().filter((col) => col.data.name !== "name" && loopar.utils.trueValue(col.data.in_list_view));
  }, [baseColumns]);

  const customMappedColumns = useMemo(() => {
    const baseCols = (mappedColumns() || []).filter(col => col.data.name !== "name")
      .map((col) => {
        if([SWITCH, CHECKBOX].includes(col.element)) {
          col.headProps = {
            className: "text-center",
          };
          col.render = (row) => {
            return (
              <div className="flex justify-center">
                <Badge variant="secondary" className={row[col.data.name] ? "bg-green-500/80 text-white" : "bg-red-500/80 text-white"}>
                  {row[col.data.name] ? "YES" : "NO"}
                </Badge>
              </div>
            )
          }
        }

        return col;
      });

    if(docRef.customColumns){
      const customCols = docRef.customColumns(baseCols);
      return [
        selectorCol(),
        ...customCols
      ];
    }

    return [
      selectorCol(),
      {
        data: {
          name: "mame",
          label: null//because first column is selector and spands 2 columns
        },
        render: (row) => {
          const color = loopar.bgColor(row.name);

          return (
            <Link
              to={`update?name=${row.name}`}
              className="justify-left flex gap-3 align-middle"
            >
              <Avatar className={`rounded-3 h-11 w-11`} style={{ backgroundColor: color }}>
                <AvatarFallback className={`bg-transparent text-xl font-bold`}>{loopar.utils.avatar(row.name)}</AvatarFallback>
              </Avatar>
              <div className="h-ful items-left flex flex-col justify-center">
                <h2>{row.name}</h2>
                <h5 className='font-bold text-slate-500 dark:text-slate-400'>{loopar.utils.UPPERCASE(getDocumentTitle(row))}</h5>
              </div>
            </Link>
          );
        }
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
        rowsProps: {
          className: "align-middle text-truncate text-center",
        },
        cellProps: {
          style: { width: 50 },
          className: "align-middle text-center",
        },
        render: (row) => {
          return (
            <Button
              variant="outline"
              onClick={(e) => {
                e.preventDefault();
                docRef.deleteRow(row);
              }}
            >
              <Trash2Icon className="text-red-500" />
            </Button>
          );
        },
      }
    ];
  }, [mappedColumns]);

  const search = (values) => {
    loopar.method(
      meta.__ENTITY__.name,
      docRef.action || meta.action,
      {},
      {
        body: {
          q: values,
          page: 1// this.pagination.page || 1,
        },
        success: (res) => {
          setRows(res.rows);
        }
      }
    );
  }
  
  return (
    <>
      <TableSearch onChange={search}/>
      <BaseTable
        {...props}
        columns={customMappedColumns} 
      />
    </>
  )
}

export function ListGrid(props) {
  const meta = props.meta || props.docRef;
  const {rows} = meta;

  return (
    <TableProvider initialMeta={meta} docRef={props.docRef} rows={rows}>
      <ListGridMiddleware
        {...props}
      />
    </TableProvider>
  )
}